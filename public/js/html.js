// pretty much just DOM manipulation
const toggle = e => {
    if(e.target.innerHTML.includes('select')){
        document.querySelector('.calculator').style.display = 'block';
        document.querySelector('.github').style.display = 'none';
    } else {
        document.querySelector('.calculator').style.display = 'none';
        document.querySelector('.github').style.display = 'block';
    }
}

const setResult = (lines, words, chars, num_of_files) => {
    const resultsPanel = document.querySelector('#results-panel');
    resultsPanel.innerHTML = `
        <div class="result">
            <p>Number of lines:</p>
            <p>${lines}</p>
        </div>
        <div class="result">
            <p>Number of words:</p>
            <p>${words}</p>
        </div>
        <div class="result">
            <p>Number of characters:</p>
            <p>${chars}</p>
        </div>
        <div class="result">
            <p>Number of files:</p>
            <p>${num_of_files}</p>
        </div>
    `;
}

calculateResult = async type => {
    if(type != ''){
        let index = 0;
        for(; index < results.length; index++)
            if(results[index].type == type)
                break;
        setResult(results[index].lines, results[index].words, results[index].chars, results[index].num_of_files);
    } else {
        const [lines, words, chars, num_of_files] = await calculateTotal();
        setResult(lines, words, chars, num_of_files);
    }
    currentFileType = type;
}

const exclude = async e => {
    // this could be func cuz I already look for match in calculateTotal
    let i = 0, exclude = false;
    for(; i < excludeType.length && !exclude; i++){
        if(excludeType[i] == e.target.innerHTML){
            // we need break because it will first increment and then check the condition
            exclude = true;
            break;
        }
    }
    if(!exclude){
        e.target.style.color = '#999';
        e.target.style.backgroundColor = '#666';
        excludeType.push(e.target.innerHTML);
    } else {
        e.target.style.color = '#fff';
        e.target.style.backgroundColor = 'inherit';
        excludeType.splice(i, 1);
    }

    if(currentFileType == ''){
        const [lines, words, chars, num_of_files] = await calculateTotal();
        setResult(lines, words, chars, num_of_files);
    }
}

const changeDisplayedFileType = e => {
    const lis = document.querySelectorAll('.filter-item');
    for(let i = 0; i < lis.length; i++){
        lis[i].style.color = '#fff';
        lis[i].style.backgroundColor = 'inherit';
    }
    e.target.style.color = '#999';
    e.target.style.backgroundColor = '#666';
    calculateResult(e.target.getAttribute('data-value'))
}

displayResult = (mode) => {
    // prolly should be better to manually calculate result here... because I can exclude files like .json and images
    panel = mode;

    const excludeFileList = document.getElementById('exclude-file-list');
    excludeFileList.innerHTML = '';
    for(let i = 1; i < results.length; i++)
        excludeFileList.innerHTML += `<li data-id="exclude" class="exclude-item">${results[i].type}</li>`;
    const excludeItems = document.querySelectorAll('.exclude-item');
    for(let i = 0; i < excludeItems.length; i++)
        excludeItems[i].addEventListener('click', exclude);

    let lis = '<li data-value="" data-id="file-filter" class="filter-item">All Files</li>';
    for(let i = 1; i < results.length; i++)
        lis += `<li data-value="${results[i].type}" data-id="file-filter" class="filter-item">${results[i].type}</li>`
    document.querySelector('#file-filter-list').innerHTML = lis;
    lis = document.querySelectorAll('.filter-item');
    for(let i = 0; i < lis.length; i++)
        lis[i].addEventListener('click', e => changeDisplayedFileType(e));
    lis[0].style.color = '#999';
    lis[0].style.backgroundColor = '#666';

    setResult(results[0].lines, results[0].words, results[0].chars, results[0].num_of_files);

    if(mode == 'calculator'){
        document.querySelector('.calculator').classList.toggle('animate');
        setTimeout(() => {
            document.querySelector('.calculator').style.display = 'none';
            document.querySelector('.results').style.display = 'block';
            document.querySelector('.results').classList.toggle('animate');
            reset();
        }, 1000);
    } else {
        setTimeout(() => {
            document.querySelector('.github').classList.toggle('animate');
            setTimeout(() => {
                document.querySelector('.github').style.display = 'none';
                document.querySelector('.results').style.display = 'block';
                document.querySelector('.results').classList.toggle('animate');
                reset();
            }, 1000);
        }, 400);
    }
}

const back = e => {
    // it will display what user used last time
    buttonsActive = !buttonsActive;
    fileList.innerHTML = 'Drop or select project folder';
    fileList.style.display = 'flex';
    if(panel == 'calculator'){
        document.querySelector('.results').classList.toggle('animate');
        setTimeout(() => {
            document.querySelector('.calculator').style.display = 'block';
            document.querySelector('.calculator').classList.toggle('animate');
            document.querySelector('.results').style.display = 'none';
        }, 1000);
    } else {
        setTimeout(() => {
            document.querySelector('.results').classList.toggle('animate');
            setTimeout(() => {
                document.querySelector('.github').style.display = 'block';
                document.querySelector('.github').classList.toggle('animate');
                document.querySelector('.results').style.display = 'none';
            }, 1000);
        }, 400);
    }
    results = [];
    panel = 'github';
}

const endAnimation = () => {
    clearInterval(animationInterval);
    document.querySelector('.loader').style.display = 'none';
    animationIndex = 0;
    breaker = true;
    for(let i = 0; i < 3; i++)
        dots[i].style.opacity = 0;
}

const startAnimation = () => {
    document.querySelector('.loader').style.display = 'flex';
    animationInterval = setInterval(() => {
        if(animationIndex == 3){
            breaker = !breaker;
            animationIndex = 0;
        }
        dots[animationIndex].style.opacity = breaker ? 1 : 0;
        animationIndex++;
    }, 200);
}