TRAIN & WALK - iPhone実機テスト用PWA

【重要】
iPhoneでPWAとして使うには、このフォルダを HTTPS で公開する必要があります。
ZIPをiPhoneの「ファイル」で開くだけでは、ホーム画面アプリとしては動きません。

【中身】
index.html
manifest.webmanifest
service-worker.js
icons/

【GitHub Pagesで公開する手順：PC推奨】
1. GitHubで新しいリポジトリを作成（例：train-walk）
2. ZIPを解凍し、中身をリポジトリ直下へアップロード
3. リポジトリの Settings → Pages
4. Source：Deploy from a branch
5. Branch：main / Folder：/(root) を選んで Save
6. 数分後、Pagesに表示された公開URLをiPhoneのSafariで開く

【iPhoneへ入れる】
1. Safariで公開URLを開く
2. 共有ボタン（□↑）
3. 「ホーム画面に追加」
4. 「追加」
5. ホーム画面の TRAIN & WALK から起動

【確認項目】
・宅トレ/ウォーキングの登録
・アプリを閉じて再起動しても実績が残る
・今週欄から履歴編集できる
・過去実績の追加/編集/削除
・ホーム画面からアプリ風に起動
・一度読み込んだ後、オフラインでも起動

【現在の保存方式】
localStorage（iPhone/Safari内）
SafariのWebサイトデータ削除、端末変更などで消える可能性があります。
本運用前にはバックアップ/復元機能の追加を推奨します。
