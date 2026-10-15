# Unredact: the Wikipedia guessing game for iPhone

An English Wikipedia article, blacked out. Guess words to reveal them; uncover the title to win.
After every finished puzzle you get a rare fact, shown above the Next article and Read article buttons.

This is a web app that installs to the iPhone home screen. No Mac, no App Store and no Apple fee needed.

## Put it online (free, about 5 minutes)

1. Sign in at github.com (create a free account if needed).
2. Click **+** (top right) > **New repository**. Name it `unredact`, keep it **Public**, click **Create repository**.
3. On the next page click **uploading an existing file**. Drag in everything *inside* this folder
   (index.html, sw.js, manifest.webmanifest, and the css, js, fonts and icons folders), then click **Commit changes**.
4. Open the repository's **Settings** > **Pages**. Under "Branch", choose **main** and **/ (root)**, then **Save**.
5. After a minute or two, the page shows your link: `https://YOUR-USERNAME.github.io/unredact/`

## Install on the iPhone

1. Open the link in **Safari** (it must be Safari for installing).
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Open Unredact from the home screen. It runs full-screen like a normal app and remembers your progress and stats.

## Customising

- **Rare facts:** `js/facts.js`, one fact per line in quotes, ending with a comma.
- **Puzzle articles:** `js/articles.js`, any English Wikipedia title.
- **Always-visible common words:** `STOP_LIST` in `js/core.js`.

To publish a change, open the file on GitHub, click the pencil icon, edit, and **Commit changes**.
The app picks it up the next time it's opened with an internet connection.

## Credits

Game idea: Redactle (redactle.net); this is an independent fan adaptation.
Article text: Wikipedia, CC BY-SA. Font: PT Serif by ParaType, SIL Open Font License (fonts/OFL.txt).
