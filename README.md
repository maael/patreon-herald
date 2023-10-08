<p align="center">
  <img width="50" height="50" src="./web/public/images/favicon.png">
</p>

<h1 align="center">Patreon Herald</h1>

Allow connecting Patreon and Twitch accounts, and play sounds to announce patreons first message.

## Features

- Play a sound when a Patreon messages for the first time on a stream
- Control which tiers can have sounds play
- Add your own custom sounds for specific Twitch users without Patreon
- Control the volume level per sound
- Approval/reject process for new sounds
- Emails when a Patreon submits a new sound for review
- Integrates via a simple URL for use as a OBS browser overlay
- Automatically removes users who are no longer supporters

## Usage

> **Note**
> Patreon-herald needs the Patreon authentication to be able to get the list of current pledges, to know who to play sounds for.

Notes on Patreon API data shapes are [here](./web/docs/patreon_api.md).

## Development

```sh
git clone git@github.com:maael/patreon-herald.git
cd patreon-herald
```

### Web Setup

```sh
cd web
yarn
yarn dev
```
