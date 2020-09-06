const pos = require('pos')
var tagger = new pos.Tagger();
const fetch = require('node-fetch')
const axios = require('axios')
const fs = require('fs')

var documentUrl = "http://norvig.com/big.txt"
const ApiKey = "dict.1.1.20170610T055246Z.0f11bdc42e7b693a.eefbde961e10106a4efa7d852287caa49ecc68cf"
const dictionaryUrl = "https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=" + ApiKey + "&lang=en-ru&text="

var wordInfo = {
    "Words": []
}

//calling Main method
main(documentUrl)

async function main(url) {

    let data

    var response = await axios.get(url)
    data = response.data

    //Remove special characters and numbers 
    data = data.toLowerCase().replace(/[^a-zA-Z ]/g, " ");

    //Create and array of all the words
    var array = data.split(" ")

    //Every word should have atleast 2 letters to make a senseful word
    array = array.filter(word => word.length > 1).sort()

    //Removing duplicates to reduce complexity
    var unique = [...new Set(array)].sort()

    //to map words and their occurences/frequency 
    var wordCountMap = new Map()

    //Counting occurence of every unique word in all of the document
    for (let index = 0; index < unique.length; index++) {

        var word = unique[index]
        var count = countOccurence(word, array)

        // Key : value pair of word : frequency
        wordCountMap.set(word, count)
    }

    //Function to count number of occurences of a word in the given document
    function countOccurence(word, array) {
        var count = 0
        for (let index = 0; index < array.length; index++) {
            if (word == array[index]) {
                count++
            }
        }
        return count
    }

    //To find out top 10 most occured words, sort the array(from map values) in descending order
    wordCountMap = Array.from(wordCountMap)
    wordCountMap.sort((a, b) => a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0)

    for (let index = 0; index < 10; index++) {
        var word = wordCountMap[index][0]
        var occurenceCount = wordCountMap[index][1]

        var dictionaryResponse = await axios.get(dictionaryUrl + word)
        dictionaryResponse = dictionaryResponse.data
        var meaning = []
        var synonyms = []

        try {
            if (Array.isArray(dictionaryResponse.def[0].tr[0].mean)) {
                dictionaryResponse.def[0].tr[0].mean.forEach(element => {
                    meaning.push(element.text)
                });
                meaning = meaning.join(", ")
            } else {
                if (dictionaryResponse.def[0].tr[0].mean)
                    meaning = dictionaryResponse.def[0].tr[0].mean.text
                else
                    meaning = "None"
            }
            if (Array.isArray(dictionaryResponse.def[0].tr[0].syn)) {
                dictionaryResponse.def[0].tr[0].syn.forEach(element => {
                    synonyms.push(element.text)
                });
                synonyms = synonyms.join(", ")
            } else {
                if (dictionaryResponse.def[0].tr[0].syn)
                    synonyms = dictionaryResponse.def[0].tr[0].syn.text
                else
                    synonyms = "None"
            }
            var posTag = dictionaryResponse.def[0].pos
        } catch (error) {
            if (!dictionaryResponse.def || dictionaryResponse.def.length == 0) {
                meaning = "None"
                synonyms = "None"
            }
            console.log(error)
        }
        var obj = {
            "Word": word,
            "Occured": occurenceCount,
            "POS": posTag,
            "Defination": meaning,
            "Synonyms": synonyms
        }
        wordInfo.Words.push(obj)
    }
    wordInfo = JSON.stringify(wordInfo)
    fs.writeFile("./test.json", wordInfo, function (err) {
        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
    console.log(wordInfo)

}