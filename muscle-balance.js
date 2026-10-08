
// TRAIN & WALK V11: estimated weekly muscle stimulation
// Main muscle = 1 set, secondary = 0.5 set. Heuristic, not medical diagnosis.
const MUSCLE_TARGETS=[
 {id:"chest",label:"胸",min:4,max:12},
 {id:"back",label:"背中",min:4,max:12},
 {id:"shoulders",label:"肩",min:4,max:12},
 {id:"triceps",label:"上腕三頭筋",min:2,max:10},
 {id:"biceps",label:"上腕二頭筋",min:2,max:10},
 {id:"quads",label:"太もも前",min:4,max:12},
 {id:"hamstrings",label:"太もも裏",min:3,max:12},
 {id:"glutes",label:"お尻",min:4,max:12},
 {id:"core",label:"腹筋",min:3,max:10}
];
const MUSCLE_RULES=[
 {match:/ショルダープレス|ミリタリープレス|オーバーヘッドプレス|shoulder.?press/i,load:{shoulders:1,triceps:.5}},
 {match:/フレンチプレス|トライセプス|キックバック|スカルクラッシャー|tricep|french.?press/i,load:{triceps:1}},
 {match:/サイドレイズ|フロントレイズ|リアレイズ|ラテラルレイズ|lateral.?raise|front.?raise|rear.?raise/i,load:{shoulders:1}},
 {match:/デッドリフト|ルーマニアン|rdl|deadlift/i,load:{hamstrings:1,glutes:1,back:.5}},
 {match:/ヒップスラスト|ヒップリフト|グルートブリッジ|hip.?thrust|glute.?bridge/i,load:{glutes:1,hamstrings:.5}},
 {match:/レッグカール|leg.?curl/i,load:{hamstrings:1}},
 {match:/カーフレイズ|calf.?raise/i,load:{}},
 {match:/スクワット|ランジ|ブルガリアン|レッグプレス|レッグエクステンション|squat|lunge|leg.?press/i,load:{quads:1,glutes:1,hamstrings:.5}},
 {match:/ローイング|ロウイング|ワンハンドロー|ベントオーバーロー|ダンベルロー|ラットプル|懸垂|チンニング|プルアップ|プルダウン|rowing|row|pulldown|pull.?up/i,load:{back:1,biceps:.5}},
 {match:/ハンマーカール|アームカール|コンセントレーションカール|バイセプス|biceps.?curl|hammer.?curl|arm.?curl/i,load:{biceps:1}},
 {match:/プッシュアップ|腕立て|チェストプレス|フロアプレス|ベンチプレス|ダンベルフライ|チェストフライ|push.?up|bench.?press|chest.?press|chest.?fly|floor.?press/i,load:{chest:1,triceps:.5,shoulders:.5}},
 {match:/アブローラー|腹筋ローラー|クランチ|シットアップ|レッグレイズ|プランク|デッドバグ|ドラゴンフラッグ|ab.?roller|crunch|plank|sit.?up|leg.?raise/i,load:{core:1}}
];
function exerciseMuscleLoad(ex){
 const rawName=String(ex.name||"");
 const master=state.masters.find(m=>(ex.id&&m.id===ex.id)||m.name===rawName);
 const name=rawName||(master&&master.name)||"";
 for(const rule of MUSCLE_RULES)if(rule.match.test(name))return rule.load;
 return null;
}
function analyzeMuscleWeek(entries){
 const totals={},dayNumbers={},recent={},consecutive=new Set(),unmatched=new Set();
 MUSCLE_TARGETS.forEach(m=>{totals[m.id]=0;dayNumbers[m.id]=[]});
 let workouts=0;
 const latest=todayKey();
 entries.forEach((entry,weekIndex)=>{
   if(entry.key>latest||!entry.rec.workout)return;
   const items=Array.isArray(entry.rec.workout.items)?entry.rec.workout.items:[];
   if(!items.length)return;
   workouts++;
   const day={};
   items.forEach(ex=>{
     const mapped=exerciseMuscleLoad(ex);
     const sets=Number(ex.sets);
     if(mapped===null){unmatched.add(String(ex.name||"名称なし"));return}
     if(!Number.isFinite(sets)||sets<=0)return;
     Object.entries(mapped).forEach(([id,share])=>{
       if(!(id in totals))return;
       const effective=Math.min(sets,100)*share;
       day[id]=(day[id]||0)+effective;
       totals[id]+=effective;
     });
   });
   Object.keys(day).forEach(id=>{
     dayNumbers[id].push(weekIndex);
     recent[id]=entry.key;
     const history=dayNumbers[id];
     if(history.length>=2&&history[history.length-1]-history[history.length-2]===1)consecutive.add(id);
   });
 });
 const high=MUSCLE_TARGETS.filter(m=>totals[m.id]>m.max);
 const low=MUSCLE_TARGETS.filter(m=>totals[m.id]<m.min);
 return {totals,recent,consecutive,unmatched:[...unmatched],workouts,high,low};
}
function renderMuscleSummary(entries){
 const info=analyzeMuscleWeek(entries),today=todayKey();
 const flags=new Set([...info.high.map(m=>m.id),...info.consecutive]);
 const labelFor=id=>MUSCLE_TARGETS.find(m=>m.id===id)?.label||"";
 const headline=document.getElementById("muscleHeadline");
 const tip=document.getElementById("muscleRecommendation");
 const rows=document.getElementById("muscleRows");
 const note=document.getElementById("muscleNote");
 if(!headline||!tip||!rows||!note)return;
 if(!info.workouts){
   headline.innerHTML='<span class="musclePill">未記録</span><span>今週の宅トレ記録はまだありません</span>';
   tip.textContent="次回はいつもの分割メニューから。記録後にバランスを自動判定します。";
 }else{
   const selected=[...flags];
   const msg=selected.length?
     "負荷集中の可能性："+selected.slice(0,2).map(labelFor).join("・")+(selected.length>2?" ほか":""):
     "今週の負荷集中サインはありません";
   headline.innerHTML='<span class="musclePill '+(selected.length?"caution":"")+'">'+(selected.length?"注意":"分析")+'</span><span>'+msg+'</span>';
   // Keep recently worked muscles out of the next-session suggestion.
   const candidates=info.low.filter(m=>{
     const key=info.recent[m.id];
     if(!key)return true;
     const days=(new Date(today+"T00:00:00")-new Date(key+"T00:00:00"))/86400000;
     return days>=2;
   });
   const priority=["back","chest","quads","hamstrings","glutes","shoulders","core","triceps","biceps"];
   candidates.sort((a,b)=>(info.totals[a.id]/a.min-info.totals[b.id]/b.min)||priority.indexOf(a.id)-priority.indexOf(b.id));
   if(candidates.length){
     tip.textContent="次回の候補："+candidates.slice(0,2).map(m=>m.label).join("・")+"。今週のセット数と直近の実施日から提案しています。";
   }else{
     tip.textContent="次回は回復を優先。疲労や痛みがなければいつものメニューを続けましょう。";
   }
 }
 rows.innerHTML=MUSCLE_TARGETS.map(m=>{
   const n=info.totals[m.id],high=n>m.max,low=n<m.min;
   const status=n===0?"未実施":high?"多め":low?"少なめ":"目安内";
   const width=Math.min(100,n/Math.max(1,m.max)*100);
   const val=Number.isInteger(n)?String(n):n.toFixed(1);
   const consecutive=info.consecutive.has(m.id)?"・連日":"";
   return '<div class="muscleRow"><div class="muscleLabel">'+m.label+'</div>'+
     '<div class="muscleTrack" role="img" aria-label="'+m.label+' '+val+'セット相当">'+
     '<div class="muscleFill '+(high?"high":low?"low":"")+'" style="width:'+width+'%"></div></div>'+
     '<div class="muscleValue">'+val+'set<span class="muscleStatus">'+status+consecutive+'</span></div></div>';
 }).join("");
 const unmatched=info.unmatched.length?" 未判定の種目："+info.unmatched.join("・")+"。":"";
 note.textContent="主働筋=1、補助筋=0.5セットの推定値。少なめ/多めは調整用の仮目安で、過負荷や回復不全の診断ではありません。「連日」は同じ部位を隣接する日に記録した場合。"+unmatched;
}
