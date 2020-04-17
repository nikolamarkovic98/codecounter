const express = require('express');
const path = require('path');
const fs = require('fs');
const {exec}  = require('child_process');
const {readFile} = require('./calculator');

const app = express();
const port = process.env.PORT || 4000;
const command = 'rm -r ';
// const command = 'rmdir /s /q ';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if(req.method === 'OPTIONS'){
        return res.sendStatus(200);
    }
    next();
});

const printFiles = files => files.forEach(file => console.log(file));

const runCommand = (command, cb) => {
    exec(command, (err, stdout, stderr) => {
        if(err != null){
            return cb(null, err);
        } else if(typeof(stderr) != 'string'){
            return cb(null, stderr);
        } else {
            return cb(stdout, null);
        }
    });
}

const getName = str => {
    // if it doesn't have / then it's prolly not even a repo
    if(!str.includes('/'))
        return 'Unknown';
    let mario = '';
    let i = str.length-1;
    if(str[i] == '/')
        str.length--;
    while(str[i] != '/'){
        mario = `${str[i]}${mario}`;
        i--;
    }
    return mario;
}

const filter = name => {
    if(name.includes('.json') || name.includes('.png') || name.includes('.jpg') || name.includes('.svg') ||
       name.includes('.ico') || name.includes('.md'))
        return false;
    return true;
}

const scanDir = async (dirPath, files) => {
    // if it's file I add it to the list, if it's another dir I scan it and add those files to the list
    // files in this scenario act like global variable within this function
    return new Promise(async (resolve, reject) => {
        try{
            const topLevelDir = await fs.promises.opendir(dirPath);
            for await (const dirent of topLevelDir){
                if(dirent.isDirectory()){
                    if(dirent.name == '.git' || dirent.name == 'node_modules')
                        continue
                    await scanDir(path.join(dirPath, dirent.name), files);
                }
                else if(dirent.isFile())
                    if(filter(dirent.name))
                        files.push(path.join(dirPath, dirent.name));
            }
        } catch(err){
            console.log(err);
            reject('Error while scanning repository');
        }
        resolve(files);
    });
}

const repoExist = async repoName => {
    return new Promise(async (resolve, reject) => {
        let dirs;
        try{
            dirs = await fs.promises.opendir(path.join(__dirname, 'repos'));
        } catch(err){
            console.log(err);
            reject(true);
        }
        let match = false;
        for await (const dirent of dirs){
            if(dirent.name.includes(repoName))
                match = true;;
        }
        resolve(match);
    });
}

const getResultObject = (lines, words, chars, num_of_files, type) => {
    return {
        type: type,
        lines: lines,
        words: words,
        chars: chars,
        num_of_files: num_of_files
    }
}

const calculate = async (fullPath, repoName) => {
    return new Promise(async (resolve, reject) => {
        // this function is going to return path of all FILES from repo
        const files = await scanDir(fullPath, []);
        
        let results = [];
        let num_of_lines = 0, num_of_words = 0, num_of_chars = 0, num_of_files = 0;
        const msg = await new Promise(async (resolve, reject) => {
            //files.forEach(async (file, index, arr) => {
            for(let index = 0; index < files.length; index++){
                const [lines, words, chars, type] = await readFile(files[index]);
                num_of_lines += lines;
                num_of_words += words;
                num_of_chars += chars;
                num_of_files++;
                if(results.length == 0){
                    results[0] = getResultObject(lines, words, chars, 1, type);
                } else {
                    let match = true;
                    for(let i = 0; i < results.length && match; i++){
                        if(results[i].type == type){
                            results[i] = getResultObject(results[i].lines + lines, results[i].words + words, 
                                                         results[i].chars + chars, results[i].num_of_files + 1, type);
                            match = false;
                        }
                    }
                    if(match){
                        // new type
                        results[results.length] = getResultObject(lines, words, chars, 1, type);
                    }
                }
                if(files.length-1 == index)
                    resolve('Success')
            };
        });
    
        runCommand(command + fullPath, async (response, err) => {
            if(err){
                console.log(err);
            }
            let exist = await repoExist(repoName);
            while(exist){
                runCommand(command + fullPath, (response, err) => {});
                exist = await repoExist(repoName);
            }
            if(msg == 'Success'){
                results.unshift({
                    type: 'all',
                    lines: num_of_lines,
                    words: num_of_words,
                    chars: num_of_chars,
                    num_of_files: num_of_files
                });
                resolve(results);
            }
        });
    });
}

app.post('/calculate', async (req, res) => {
    try{
        const repo = req.body.url;
        const repoName = getName(repo);
        if(repoName == 'Unknown')
            res.json({err: 'Not valid Github repository!'});
        const fullPath = path.join(__dirname, 'repos', repoName);
        
        // checking if repo already exists because http sends like a hundred requests
        let exist = await repoExist(repoName);
        if(!exist){
            new Promise((resolve, reject) => {
                runCommand(`git clone ${repo} ${fullPath}`, (response, err) => {
                    if(err){
                        reject('Not valid Github repository!');
                    }
                    else
                        resolve('Fetched repo');
                });
            })
            .then(async smthn => {
                try{
                    const results = await calculate(fullPath, repoName);
                    res.json(results);
                } catch(err){
                    console.log(err);
                }
            })
            .catch(err => {
                res.json({err: err});
                res.end();
            });
        }
    } catch(err){
        console.log(err);
    }
});

app.listen(port, () => console.log(`Server started on port ${port}`));