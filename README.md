# Can I Use It Now?

## Description
A tool to complement caniuse.com.
Get email notifications when certain web features reach the support criteria you defined:
1. Global support (%)
2. Baseline status (Newly / Widely available)
2. Specific browser support (%)
3. Specific browser version (number)

## Why did I make this?
I was tired of using calendar reminders to check if feature support has changed to a point I consider relevant. There's and RSS feed, but it's not targeted enough.

## Tech stack
- Front-End: Vue.js (Typescript)
- Back-end: Node.js
- Database + Auth: Supabase
- Emailing: NotificationAPI (now renamed Pingram)
- Deployment: Cloudflare Pages

## Data used
Imitated caniuse.com structure and pooled 3 sources:
1. caniuse.com (primary)
2. Web-Features
3. Mozilla MDN

Since I don't have StatCounter API access (it ain't free!) for browser usage data, I use the worldwide usage data json from caniuse.com github repo to calculate estimated support percentage from Web-Features/MDN. The accuracy is + - 1%, so not too shabby. Hope no one gets angry.


### Data unused from feature files (not index):

- browser.firstFull
- browser.latestVersion

Keeping for now, just in case.
