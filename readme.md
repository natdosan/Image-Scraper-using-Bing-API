# Image Scraper using Bing API

## Usage

1. find your azure subscription key for Bing Image Search api
2. put your subscription key in .env assigned to `BING_KEY`

ex:

```
BING_KEY=9840937328974383928738
```

3. Start the script by using `node index.js` or `npm start`.

Instead of typing the search query and maximum amount in the script, you can supply arguments:

```bash
node index.js -s "Trees" -a 30
# Get a maximum of 30 photos of "Trees"
```

You can also specify an output directory:

```bash
node index.js -s "Trees" -a 30 -o ./trees
```
