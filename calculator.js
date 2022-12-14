const fs = require("fs");

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

const readFile = async (path) => {
    const type = getFileType(path);
    const text = await fs.readFileSync(path, { encoding: "UTF-8" });
    return [
        text.split(/\r?\n/g).length,
        text.split(" ").length,
        text.length,
        type,
    ];
};

module.exports = {
    readFile,
};
