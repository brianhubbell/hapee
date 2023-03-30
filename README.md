# hapee

Standalone Node.js application that exposes Govee bluetooth temperature/humidity sensors to HomeKit.

Supported hardware:

- Govee H5074

Supported attributes:

- temperature
- humidity
- battery

## copy and update env

`cp .env.example .env`

## install

`npm i`

## run in background and at startup using pm2

`pm2 start && pm2 save && pm2 dash`

## troubleshooting

enable debug logging by setting `DEBUG=true` in `.env`
