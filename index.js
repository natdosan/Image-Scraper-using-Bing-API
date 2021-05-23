const axios = require("axios");
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
require("dotenv").config(); // https://www.npmjs.com/package/dotenv

function download(url, image_path) {
  // https://stackoverflow.com/questions/12740659/downloading-images-with-node-js
  return axios({
    url, // url: url,
    responseType: "stream", // downloads the image as "stream"
  }).then(
    (response) =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(image_path))
          .on("finish", () => resolve())
          .on("error", (e) => reject(e));
      })
  );
}

function getBingData(query, start, count) {
  // returns promise
  return axios({
    // object
    method: "get",
    url: "https://api.bing.microsoft.com/v7.0/images/search",
    params: {
      // all params of the query @ https://docs.microsoft.com/en-us/bing/search-apis/bing-image-search/reference/query-parameters
      q: query,
      offset: start, // dynamic offset
      size: "Large",
      count: count,
    },
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.BING_KEY,
    },
  });
}

filesArray = [];
let totalPhotosRequested = 0;

async function getImages(query, start, numberOfPhotos) {
  const response = await getBingData(query, start, numberOfPhotos); // wait until its done because getBing is an asynch funciton
  return new Promise((resolve, reject) => {
    const items = response.data.value; // receive 150 items each time, thenn filesArray is appended until 1000 items reached
    // this is an *array* of the search results; value is the array from the bing data
    let i;
    for (i = 0; i < items.length; i++) {
      const received_data = items[i];
      const imageUrl = received_data.contentUrl;
      // if (!imageUrl.match(/scontent-frt3-1.cdninstagram.com/g)) {
      filesArray.push(imageUrl.replace("\\", "")); // push appends the array
    }
    console.log(`filesArray now has ${filesArray.length} photos of ${query}`);
    setTimeout(function () {
      console.log(totalPhotosRequested - filesArray.length);
      if (totalPhotosRequested - filesArray.length >= 150) {
        // request 150 more
        resolve(getImages(query, start + 150, 150)); // recurser function because it runs until a condition is satisfied
      } else if (filesArray.length == totalPhotosRequested) {
        // request(requestedPhotos-total)
        resolve(filesArray); // end end, start downloading files
      } else if (totalPhotosRequested - filesArray.length < 150) {
        resolve(
          getImages(
            query,
            start + 150,
            totalPhotosRequested - filesArray.length
          )
        ); // recurser function because it runs until a condition is satisfied
      }
    }, 3000); // setting the waiting time to 3000 milliseconds; after the time, we want to execute the functionn inside it (1st param)
  });
}

function getAndSaveImages(query, numberOfPhotos) {
  getImages(query, 0, numberOfPhotos).then(async (filesArray) => {
    fs.access("./downloaded", (err) => {
      if (err) {
        fs.mkdirSync("./downloaded");
      } else {
        return;
      }
    });
    // console.log(filesArray)
    let i;
    for (i = 0; i < filesArray.length; i++) {
      const splitUrl = filesArray[i].split("/");
      const dowloadedImg = splitUrl[splitUrl.length - 1];
      // https://stackoverflow.com/questions/6603015/check-whether-a-string-matches-a-regex-in-js
      if (
        /\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP|jfif|JFIF)$/g.test(
          dowloadedImg
        )
      ) {
        download(
          filesArray[i],
          path.join(__dirname, "downloaded", dowloadedImg)
        )
          .then(() => {
            console.log(`downloaded photo ${dowloadedImg}`);
          })
          .catch(() => {
            console.log(`skipped photo ${dowloadedImg}`);
          });
      } else {
        console.log(
          `skipped photo ${dowloadedImg} because there is no extension`
        );
      }
    }
  });
}

rl.question("What do you want to search for? ", (query) => {
  rl.question("How many photos do you want? ", (numberOfPhotos) => {
    totalPhotosRequested = numberOfPhotos;
    getAndSaveImages(query, parseInt(numberOfPhotos));
    rl.close();
  });
});
