// descs toggle between github and select
const descs = document.querySelectorAll('.desc-toggle');
for(let i = 0; i < descs.length; i++)
    descs[i].addEventListener('click', e => toggle(e));

document.querySelector('#back').addEventListener('click', back);
document.querySelector('#github-calculate').addEventListener('click', calculateRepo);
document.querySelector('#select-calculate').addEventListener('click', calculate);

fileLoader.addEventListener('click', e => {
    if(filesAdded)
        e.preventDefault();
});
fileLoader.addEventListener('change', e => addFiles(e.target.files));

// drag and drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName =>
    fileList.addEventListener(eventName, e => e.preventDefault()));

fileList.addEventListener('mouseover', changeToOrange);
fileList.addEventListener('mouseout', changeToGray);

['dragenter', 'dragover'].forEach(eventName => {
    fileList.addEventListener(eventName, changeToOrange)});

['dragleave', 'drop'].forEach(eventName => {
    fileList.addEventListener(eventName, e => changeToGray)});

fileList.addEventListener('drop', handleDrop);

// fileFilter.addEventListener('change', e => calculateResult(e.target.value));

let excludeMode = false;
document.body.addEventListener('click', e => {
    const dataAttr = e.target.getAttribute('data-id');
    if(dataAttr == 'exclude'){
        if(e.target.innerHTML == 'Exclude'){
            if(excludeMode){
                document.getElementById('exclude-file-list').style.display = 'none';
            } else {
                document.getElementById('exclude-file-list').style.display = 'block';
            }
            excludeMode = !excludeMode;
        }
    } else {
        if(excludeMode)
            excludeMode = !excludeMode;
        document.getElementById('exclude-file-list').style.display = 'none';
    }

    if(dataAttr == 'file-filter'){
        if(e.target.innerHTML == 'Filter'){
            if(filterMode){
                document.querySelector('#file-filter-list').style.display = 'none';
            } else {
                document.querySelector('#file-filter-list').style.display = 'block';
            }
            filterMode = !filterMode;
        }
    } else {
        if(filterMode)
            filterMode = !filterMode;
        document.getElementById('file-filter-list').style.display = 'none';
    }
});