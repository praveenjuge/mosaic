# Mosaic

## Install dependencies

```sh
bun install
```

## Run development server

```sh
bun dev
```

## Environment variables

Copy the `.env.example` file to `.env` and add your credentials:

```sh
cp .env.example .env
```

Then edit `.env` and provide values for the required variables.
The `.env.example` file documents each variable used by the project.
Set Upstash credentials (`KV_REST_API_URL` and `KV_REST_API_TOKEN`) to enable caching generated OG image URLs.
