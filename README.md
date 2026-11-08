# DFlix Episode Tracker

An unofficial Chrome extension for dflix.live. It remembers the last selected season and episode for each series. On compatible players it also saves the playback time, so you can return with **Continue**.

## ছবি দেখে ইনস্টল করো · Desktop Chrome

**১. ZIP extract করো।** ডাউনলোড করা ZIP-এ right-click → **Extract All**। Folder-টা যেখানে রাখতে চাও সেখানেই রাখো। File Explorer-এ খুলে দেখে নাও কোন folder-এর ভেতরে সরাসরি `manifest.json` আছে।

**২. Chrome-এ extension লোড করো।** Address bar-এ `chrome://extensions` লিখে Enter চাপো। ছবির সবুজ বক্সে **Developer mode** চালু করো। তারপর কমলা বক্সের **Load unpacked** চাপো।

![Chrome Extensions screenshot showing Developer mode and Load unpacked](docs/chrome-extensions.png)

**৩. সঠিক folder বেছে নাও।** যে folder-এ `manifest.json` দেখেছিলে, তার ভেতরে গিয়ে **Select Folder** চাপো। এই window-তে ফাইলগুলো দেখা না গেলেও ঠিক আছে। নিচের path-টা উদাহরণ।

![Folder selection example with the Select Folder button](docs/select-folder.png)

**৪. DFlix খুলে পরীক্ষা করো।** Watch page refresh করে ডানদিকের তালিকা থেকে যে episode দেখছ সেটা চাপো। নিচের screenshot-এ **NOW** দিয়ে চলতি episode দেখানো হয়েছে।

![DFlix episode panel with the NOW marker beside the selected episode](docs/choose-episode.png)

১০ সেকেন্ড চালিয়ে pause করো। নিচে tracker-এ episode-এর পাশে সময় দেখলে পেজ refresh করে **Continue** চাপো। Player আগের সময় থেকে চললে setup শেষ।

## Watch and resume

Select an episode and play it. When the tracker shows a timestamp beside the episode number, playback time is being saved. Reopen the series and click **Continue**. If prompted, choose the saved season first. Some players also require a click on **Play**.

If only the episode appears, open the extension popup while watching. If the video is embedded from a separate HTTPS host, the popup offers a button to enable that host. Grant access to the player you use, then refresh the watch page. Player compatibility depends on how the site embeds its video.

## Local data and permissions

The extension stores the series ID, season, episode, and playback position in Chrome's local extension storage. It has no analytics, account service, or remote backend. A permitted embedded player exchanges playback state and resume commands with its DFlix parent page.

- **Storage** saves progress in the current Chrome profile.
- **Active tab and scripting** let the popup inspect the current watch page for an embedded player and enable its playback helper.
- **Optional HTTPS host access** is requested for the specific embedded host you select. Player hosts can vary by series.

## Update and verify

Replace the files in the existing installation folder, click **Reload** on the extension card, then refresh the DFlix tab. Loading an unpacked copy from a different folder can give it a separate progress history.

To test your player, watch for ten seconds, pause, refresh, and click **Continue**. Check both the episode and the player's timestamp. If reporting an issue, include the extension version and whether the tracker showed an episode, a timestamp, or both.

This project is independent of DFlix.

Chrome settings screenshot cropped from [Chrome for Developers](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
