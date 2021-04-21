'use strict';

$(function (){
    let materializeElems = {
        modal: $('.modal'),
        sidenav: $('.sidenav'),
    };

    let elements = {
        searchSection: $('.js-search-section'),
        gamesSection: $('.js-games-section'),
        resultSection: $('.js-result-section'),
        searchForm: $('.js-search-form'),
        gamesList: $('.js-games-list'),
        showMoreBtn: $('.js-load-more'),
        gameResults: $('.js-game-results'),
        gameShuffle: $('.js-game-shuffle'),
        musicResults: $('.js-music-results'),
        musicShuffle: $('.js-music-shuffle'),
        saveForm: $('.js-save-pair-form'),
        tracksList: $('.js-tracks-list'),
        pairsList: $('.js-pairs-list'),
    }

    let gameApiData = {
        url: 'https://www.giantbomb.com/api/',
        key: 'ca21f96f411cc413f9234dbec4a20f729ca3fb2b',
    }

    let musicApiData = {
        clientId: '9f0ad941c5394f4ca74562dbeaa29135',
        clientSecret: '112c92661a7b4d779c01b08c3210ea94',
    }

    let savedPairs = JSON.parse(localStorage.getItem('savedPairs')) || {};

    let currentPairData = {
        gameInfo: undefined,
        tracksInfo: undefined,
    };

    function getRandomInt(max) {
        // return random integer from 0 to 'max'
        return Math.floor(Math.random() * Math.floor(max));
    }

    function hideSection(section) {
        if (!section.hasClass('hide')) {
            section.addClass('hide');
        }
    }

    function showSection(section) {
        if (section.hasClass('hide')) {
            section.removeClass('hide');
        }
    }

    function showSearchSection() {
        hideSection(elements.gamesSection);
        hideSection(elements.resultSection);
        showSection(elements.searchSection);
    }

    function showGamesSection() {
        hideSection(elements.searchSection);
        hideSection(elements.resultSection);
        showSection(elements.gamesSection);
    }

    function showResultSection() {
        hideSection(elements.searchSection);
        hideSection(elements.gamesSection);
        showSection(elements.resultSection);
    }

    /* Game Search */

    function proxyFetch(url, options) {
        url = 'https://ben.hutchins.co/proxy/fetch/' + url;

        return fetch(url, options);
    }

    function searchGames(event) {
        // console.log('%c Search Games ', 'color: #05AFF2;');
        event.preventDefault();

        let eventElem = $(event.currentTarget);
        let isForm = eventElem.is('form');
        let isLoadMore = eventElem.is(elements.showMoreBtn);

        let searchQuery = '';
        let page = 1;
        let limit = 12;

        if (isForm) {
            elements.gamesList.text('');
            searchQuery = eventElem.find('input[type="search"]').val().trim();
        }

        if (isLoadMore) {
            searchQuery = eventElem.data('search-query');
            page = eventElem.data('page');
        }

        let requestUrl = `${gameApiData.url}search/?format=json&api_key=${gameApiData.key}&resources=game&query=${encodeURI(searchQuery)}&limit=${limit}&page=${page}`;

        proxyFetch(requestUrl)
            .then((response) => {
                // console.log(response);
                if (response.ok){
                    return response.json();
                }
            })
            .then((data) => {
                // console.log(data);
                if (data !== undefined) {
                    displayGamesSearchResults(data.results);

                    let itemOnPage = data.number_of_page_results;
                    let loadLimit = data.limit;

                    if (itemOnPage === loadLimit) {
                        elements.showMoreBtn
                            .data({
                                'search-query': searchQuery,
                                'page': ++page,
                            })
                            .removeAttr('disabled')
                            .removeClass('hide')
                            .on('click.loadMore', loadMoreResults);
                    } else {
                        elements.showMoreBtn.addClass('hide');
                    }
                }
            });
    }

    function loadMoreResults(event) {
        // console.log('%c Load More Results ', 'color: #05AFF2;');
        $(event.currentTarget)
            .attr('disabled', true)
            .off('click.loadMore');

        searchGames(event);
    }

    function displayGamesSearchResults(searchedData) {
        // console.log('%c Display Game Search Results ', 'color: #F24141;');

        searchedData.forEach((item) => {
            let gameInfo = {
                name: item.name,
                thumb: item.image.small_url,
                id: item.guid,
            };

            let gameItem = $(`
                <li class="game-item">
                    <div class="game-img">
                        <img src="${gameInfo.thumb}" alt="${gameInfo.name}">
                    </div>
                    <h2 class="game-name">${gameInfo.name}</h2>
                </li>
            `);

            gameItem
                .data('game-id', gameInfo.id)
                .on('click', selectGame);

            elements.gamesList.append(gameItem);
        });

        showGamesSection();
    }

    /* END Game Search */

    /* Game Data */

    function selectGame(event) {
        // console.log('Select Game');
        let eventElem = $(event.currentTarget);
        let gameId = eventElem.data('game-id');

        if (gameId !== undefined) {
            let requestUrl = `${gameApiData.url}game/${gameId}/?format=json&api_key=${gameApiData.key}`;

            proxyFetch(requestUrl)
                .then((response) => {
                    if (response.ok){
                        return response.json();
                    }
                })
                .then((data) => {
                    // console.log(data);
                    getMusicData();
                    displaySelectedGameData(data.results);
                    showResultSection();
                });
        }
    }

    function displaySelectedGameData(gameData) {
        // console.log('Display Game Data');
        let gameInfo = {
            name: gameData.name,
            img: gameData.image.medium_url,
            deck: gameData.deck,
            releaseDate: dayjs(gameData.original_release_date, 'YYYY-MM-DD').format('D MMM YYYY'),
            genres: gameData.genres.map((item) => {
                return item.name;
            }),
            platforms: gameData.platforms.map((item) => {
                return item.name;
            }),
        };

        displayGameElem(gameInfo);
    }

    function displayGameElem(gameData) {
        currentPairData.gameInfo = gameData;

        let gameElem = $(`
            <div class="game-image">
                <img src="${gameData.img}" alt="${gameData.name}">
            </div>
            <ul class="game-info-list">
                <li class="info-item game-name">${gameData.name}</li>
                <li class="info-item release-date">Release Date: ${gameData.releaseDate}</li>
                <li class="info-item game-desc">Description: ${gameData.deck}</li>
                <li class="info-item game-genre">Genre: ${gameData.genres.reduce((accum, value, index, array) => {
                    return accum + (index !== array.length ? ', ' : '') + value;
                })}</li>
                <li class="info-item platform-icon">${gameData.platforms.reduce((accum, value, index, array) => {
                    return accum + (index !== array.length ? ', ' : '') + value;
                })}</li>
            </ul>
        `);

        elements.gameResults.text('').append(gameElem);
    }

    /* END Game Data */

    /* Music Data */

    async function getMusicApiToken() {
        let result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded', 
                'Authorization' : 'Basic ' + btoa(musicApiData.clientId + ':' + musicApiData.clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        let data = await result.json();

        return data.access_token;
    }

    async function getMusicGenres() {
        let token = await getMusicApiToken();

        let result = await fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        let data = await result.json();

        return data;
    }

    async function getMusicRecommendationByGenre() {
        let token = await getMusicApiToken();
        let genres = await getMusicGenres().then((data) => {
            return data.genres;
        });
        let limit = 10;

        let genreIndex = getRandomInt(genres.length);

        let result = await fetch(`https://api.spotify.com/v1/recommendations?seed_genres=${genres[genreIndex]}&limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        let data = await result.json();

        let genreTitle = elements.musicResults.find('.js-genre-name');

        genreTitle.text(`Genre: ${genres[genreIndex]}`);

        // console.log(data);
        return data;
    }

    function getMusicData() {
        if (!elements.musicShuffle.attr('disabled')) {
            elements.musicShuffle.attr('disabled', true);
        }

        getMusicRecommendationByGenre()
            .then((data) => {
                // console.log(data.tracks);
                displayMusicData(data.tracks);
            });
    }

    function displayMusicData(musicData) {
        elements.tracksList.text('');
        currentPairData.tracksInfo = [];
        console.log(musicData);

        musicData.forEach((item) => {
            let trackInfo = {
                album: item.album.name,
                thumb: item.album.images[2].url,
                releaseYear: dayjs(item.release_date, 'YYYY-MM-DD').format('YYYY'),
                artists: item.artists.map((item) => {
                    return item.name;
                }),
                name: item.name,
                link: item.external_urls.spotify,
                previewUrl: item.preview_url,
            };

            displayTrackItem(trackInfo);
        });

        elements.musicShuffle.removeAttr('disabled');
    }

    function displayTrackItem(trackData) {
        let trackPreview = ``;

        if (trackData.previewUrl !== null) {
            trackPreview = `
                <div class="track-preview js-track-preview">
                    <i class="material-icons small">play_circle_outline</i>
                    <audio src="${trackData.previewUrl}">
                </div>
            `;
        }

        let trackItem = $(`
            <li class="track-item">
                ${trackPreview}
                <a href="${trackData.link}" target="_blank" rel="external">
                    <div class="thumb">
                        <img src="${trackData.thumb}" alt="${trackData.album}">
                    </div>
                    <div class="track-info">
                        <p class="track-name">${trackData.name}</p>
                        <p class="about-track">
                            <span class="artists">${trackData.artists.reduce((accum, value, index, array) => {
                                return accum + (index !== array.length ? ', ' : '') + value;
                            })}</span>
                            <span class="album">${trackData.album}</span>
                            <span class="separator">&bull;</span>
                            <span class="release-year">${trackData.releaseYear}</span>
                        </p>
                    </div>
                </a>
            </li>
        `);

        if (trackData.previewUrl !== null) {
            trackItem.on('click', '.js-track-preview', playMusicPreview);
        }

        currentPairData.tracksInfo.push(trackData);

        elements.tracksList.append(trackItem);
    }

    function playMusicPreview(event) {
        event.stopPropagation();
        let eventElem = $(event.currentTarget);
        let icon = eventElem.find('.material-icons');
        let audio = eventElem.find('audio')[0];

        if (audio.paused == false) {
            audio.pause();
            icon.text('play_circle_outline');
        } else {
            audio.volume = 0.2;
            audio.play();
            icon.text('pause_circle_outline');
        }
    }

    /* END Music Data */

    /* Pair Data */

    function savePairData(event) {
        console.log('Save Game Music Data');
        event.preventDefault();

        let pairName = $(event.currentTarget).find('.js-pair-name').val().trim();

        if (currentPairData.gameInfo === undefined
        && currentPairData.tracksInfo === undefined
        || pairName === '') {
            return;
        }

        let isExistedPair = savedPairs[pairName] ? true : false;

        savedPairs[pairName] = currentPairData;

        localStorage.setItem('savedPairs', JSON.stringify(savedPairs));

        materializeElems.modal.modal('close');

        if (!isExistedPair) {
            displayPairItem(pairName);
        }
    }

    function displayPairsList() {
        console.log('Display Pairs List');
        elements.pairsList.text('');

        let pairs = Object.keys(savedPairs);

        if (pairs.length > 0) {
            for (let item of pairs) {
                displayPairItem(item);
            }
        }
    }

    function displayPairItem(pairName) {
        console.log('Display Pair Item');
        // console.log(pairName);
        let pairElem = $(`
            <li class="pair-item">${pairName}</li>
        `);

        pairElem
            .data({
                'pair-name': pairName,
            })
            .on('click', displayPairData);

        elements.pairsList.append(pairElem);
    }

    function displayPairData(event) {
        console.log('Display Pair Data');
        let eventElem = $(event.currentTarget);
        let pairName = eventElem.data('pair-name');

        // console.log(savedPairs[pairName]);
        displayGameElem(savedPairs[pairName].gameInfo);

        elements.tracksList.text('');
        currentPairData.tracksInfo = [];

        savedPairs[pairName].tracksInfo.forEach(displayTrackItem);
        elements.musicShuffle.removeAttr('disabled');
        showResultSection();
    }

    /* END Pair Data */

    function init() {
        console.log('%c Init', 'color: #0455BF;');

        materializeElems.sidenav.sidenav();
        materializeElems.modal.modal();

        displayPairsList();

        elements.searchForm.on('submit', searchGames);
        elements.musicShuffle.on('click', getMusicData);
        elements.gameShuffle.on('click', showSearchSection);
        elements.saveForm.on('submit', savePairData);
    }

    init();
});
