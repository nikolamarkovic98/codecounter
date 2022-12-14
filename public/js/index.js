let files = [],
    excludeType = [];
const fileList = document.querySelector("#file-list");
const fileLoader = document.querySelector("#file-loader");
const labelFileLoader = document.querySelector("#label-file-loader");

const fileFilter = document.querySelector("#file-filter");
let currentFileType = "",
    filterMode = false;

const dots = document.querySelectorAll(".loader-dot");
let animationInterval,
    animationIndex = 0,
    breaker = true;
let panel = "github",
    buttonsActive = true,
    filesAdded = false;

let results = [];

const myurl = "https://code-counter.onrender.com";
// const myurl = 'http://localhost:4000';

const calculateTotal = () => {
    return new Promise((resolve, reject) => {
        let lines = results[0].lines,
            words = results[0].words,
            chars = results[0].chars,
            num_of_files = results[0].num_of_files;
        results.forEach((result, resultIndex, arr) => {
            let exclude = false;
            for (let i = 0; i < excludeType.length && !exclude; i++)
                if (excludeType[i] == result.type) exclude = true;
            if (exclude) {
                lines = Math.abs(lines - result.lines);
                words = Math.abs(words - result.words);
                chars = Math.abs(chars - result.chars);
                num_of_files = Math.abs(num_of_files - result.num_of_files);
            }
            if (arr.length - 1 == resultIndex)
                resolve([lines, words, chars, num_of_files]);
        });
    });
};

const reset = () => {
    files = [];
    document.querySelector("#repo").value = "";
    renderFiles();
};

const removeFile = (id) => {
    for (let i = 0; i < files.length; i++) {
        if (files[i].id == id) {
            files.splice(id, 1);
            break;
        }
    }
    renderFiles();
};

const addFiles = async (_files) => {
    // validation
    await new Promise((resolve, reject) => {
        for (let i = 0; i < _files.length; i++) {
            if (_files[i].type == "") {
                let type = getFileType(_files[i].name);
                Object.defineProperty(_files[i], "type", {
                    value: type,
                    writable: false,
                });
            }
            files.push({
                id: Math.random(),
                file: _files[i],
            });
        }
        resolve("Success");
    });
    fileLoader.value = "";
    filesAdded = !filesAdded;
    fileList.style.backgroundColor = "inherit";
    fileList.style.borderColor = "#666";
    fileList.style.display = "block";
    renderFiles();
};

const renderFiles = () => {
    // renders files and adds event listener to buttons
    fileList.innerHTML = "";
    files.forEach((file) => {
        fileList.innerHTML += `
            <div class="file" data-id="${file.id}">
                <p class="file-name">${file.file.name}</p>
                <button class="remove-btn">Remove</button>
            </div>
        `;
    });
    const removeButtons = document.querySelectorAll(".remove-btn");
    for (let i = 0; i < removeButtons.length; i++) {
        const id = removeButtons[i].parentElement.getAttribute("data-id");
        removeButtons[i].addEventListener("click", (e) => removeFile(id));
    }
};

const getFileType = (fileName) => {
    if (!fileName.includes(".")) return "No MIME Type";
    let type = "",
        i = fileName.length - 1;
    while (fileName[i] != ".") {
        type = fileName[i] + type;
        i--;
    }
    return type;
};

const getResultObject = (type, lines, words, chars, num_of_files) => {
    return {
        type: type,
        lines: lines,
        words: words,
        chars: chars,
        num_of_files: num_of_files,
    };
};

const calculate = async (e) => {
    if (files.length == 0) {
        document.querySelector("#select-msg").innerHTML =
            "You did not select any file!";
        return;
    }
    if (!buttonsActive) return;
    buttonsActive = !buttonsActive;
    filesAdded = !filesAdded;
    let num_of_lines = 0;
    let num_of_words = 0;
    let num_of_chars = 0;
    let num_of_files = 0;
    startAnimation();
    const msg = await new Promise(async (resolve, reject) => {
        // files.forEach(async (file, index, arr) => {
        // forEach is actually bad when you need to do some calcs
        for (let index = 0; index < files.length; index++) {
            // going through each file and calculating
            const [lines, words, chars] = await readFile(files[index].file);
            num_of_lines += lines;
            num_of_words += words;
            num_of_chars += chars;
            num_of_files++;
            if (results.length == 0) {
                results[0] = getResultObject(
                    files[index].file.type,
                    lines,
                    words,
                    chars,
                    1
                );
            } else {
                let match = true;
                for (let i = 0; i < results.length && match; i++) {
                    if (results[i].type == files[index].file.type) {
                        results[i] = getResultObject(
                            files[index].file.type,
                            results[i].lines + lines,
                            results[i].words + words,
                            results[i].chars + chars,
                            results[i].num_of_files + 1
                        );
                        match = false;
                    }
                }
                if (match) {
                    // new type
                    results[results.length] = getResultObject(
                        files[index].file.type,
                        lines,
                        words,
                        chars,
                        1
                    );
                }
            }
        }
        resolve("Success");
    });
    endAnimation();
    if (msg == "Success") {
        results.unshift({
            type: "all",
            lines: num_of_lines,
            words: num_of_words,
            chars: num_of_chars,
            num_of_files: num_of_files,
        });
        displayResult("calculator");
    }
};

const readFile = (file) => {
    return new Promise((resolve, reject) => {
        // passing a file object and reading with FileReader
        // reader.onload fires after readAsText is finished and that's why we need Promise
        let reader = new FileReader();
        reader.onload = () => {
            const text = reader.result;
            const chars = text.length;
            const words = text.split(" ").length;
            const lines = text.split(/\r?\n/g).length;
            resolve([lines, words, chars]);
        };
        reader.readAsText(file);
    });
};

const githubRepo = (repo) => {
    if (repo.includes("http://www.github.com/")) return false;
    if (repo.includes("https://www.github.com/")) return false;
    if (repo.includes("http://github.com/")) return false;
    if (repo.includes("https://github.com/")) return false;

    return true;
};

const calculateRepo = async (e) => {
    const repo = document.querySelector("#repo").value.trim().toLowerCase();
    if (repo == "") {
        document.querySelector("#github-msg").innerHTML = "URL is required!";
        return;
    }
    if (githubRepo(repo)) {
        document.querySelector("#github-msg").innerHTML =
            "Not a valid github repository!";
        return;
    }
    document.querySelector("#github-msg").innerHTML = "";
    // buttonsActive makes sure user can click on button only once
    if (!buttonsActive) return;
    buttonsActive = !buttonsActive;
    startAnimation();
    const result = await fetch(`${myurl}/calculate`, {
        method: "POST",
        body: JSON.stringify({ url: repo }),
        headers: {
            "Content-Type": "application/json",
        },
    });
    results = await result.json();
    endAnimation();
    if (results.err != undefined) {
        document.querySelector("#github-msg").innerHTML =
            "Not a valid github repository!";
        return;
    }
    displayResult("github");
};

const readEntriesPromise = async (directoryReader) => {
    try {
        return await new Promise((resolve, reject) =>
            directoryReader.readEntries(resolve, reject)
        );
    } catch (err) {
        console.log(err);
    }
};

const readAllDirectoryEntries = async (directoryReader) => {
    let entries = [];
    let readEntries = await readEntriesPromise(directoryReader);
    while (readEntries.length > 0) {
        entries.push(...readEntries);
        readEntries = await readEntriesPromise(directoryReader);
    }
    return entries;
};

const handleDrop = async (e) => {
    if (!filesAdded) {
        filesAdded = !filesAdded;
    } else {
        return;
    }
    files = [];
    let entries = [];
    [...e.dataTransfer.items].forEach((item) =>
        entries.push(item.webkitGetAsEntry())
    );
    while (entries.length > 0) {
        const entry = entries.shift();
        if (entry.name == "node_modules" || entry.name == ".git") continue;
        if (entry.isFile) {
            try {
                const file = await new Promise((resolve, reject) =>
                    entry.file(resolve, reject)
                );
                // type is sometimes empty so I change it dinamically
                if (file.type == "") {
                    let type = getFileType(file.name);
                    Object.defineProperty(file, "type", {
                        value: type,
                        writable: false,
                    });
                }
                files.push({
                    id: Math.random(),
                    file: file,
                });
            } catch (err) {
                console.log(err);
            }
        } else if (entry.isDirectory) {
            entries.push(
                ...(await readAllDirectoryEntries(entry.createReader()))
            );
        }
    }
    fileList.style.display = "block";
    fileList.style.backgroundColor = "inherit";
    fileList.style.borderColor = "#666";
    renderFiles();
};

const changeToOrange = (e) => {
    if (!filesAdded) {
        fileList.style.backgroundColor = "rgb(255, 166, 0, 0.1)";
        fileList.style.borderColor = "orange";
    }
};

const changeToGray = (e) => {
    if (!filesAdded) {
        fileList.style.backgroundColor = "inherit";
        fileList.style.borderColor = "#666";
    }
};
