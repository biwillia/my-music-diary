# my-music-diary
My Music Diary (my-music-diary.com)


This is a tabular music player that runs my organ improvisation site https://my-music-diary.com

## Running locally

Requires the Vercel CLI (`npm i -g vercel`) and a one-time `vercel link` to the `my-music-diary` project.

    vercel dev --listen 3001

Then open http://localhost:3001. (Port 3000 is forwarded into WSL on this machine, so use 3001.)

The contact form posts to `api/send-email.js`, which sends through Mailgun using the `MAILGUN_API_KEY`, `MAILGUN_FROM_EMAIL` and `MAILGUN_TO_EMAIL` environment variables. These are set for Production only, so the form won't send from `vercel dev` unless Development values are added in the Vercel dashboard.

## Deploying

Hosted on Vercel. Pushing to `master` deploys to production.
