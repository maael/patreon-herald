<p align="center">
  <img width="150" height="150" src="./app/resources/icons/appIcon.png">
</p>

<h1 align="center">Patreon Herald</h1>

Allow connecting Patreon and Twitch accounts, and play sounds to announce patreons first message.

## Features

- TBC

## Usage

Download the latest release from the [Releases page here](https://github.com/maael/patreon-herald/releases).

Download the `patreon-herald.zip`, unzip it, and run the `patreon-herald.exe`.

You'll be asked to click a link to go to Patreon to authenticate to get a token.

> **Note**
> Patreon-herald needs the Patreon authentication to be able to get the list of current pledges, to know who to play sounds for.

## Technical Features

- Includes both the "native" app (JS/TS with React in a Neutralino.js shell) and the web component (Next.js website hosted on Vercel)

## Development

```sh
git clone git@github.com:maael/patreon-herald.git
cd patreon-herald
```

### App Setup

```sh
cd app
yarn
neu update
yarn dev
```

### Web Setup

```sh
cd web
yarn
yarn dev
```

## Build

```sh
npm run build
```

This will make a `dist/patreon-herald` directory, that can be zipped and distributed.
