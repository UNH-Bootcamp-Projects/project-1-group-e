'use strict';

$(function (){
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
    }

    let gameApiData = {
        url: 'https://www.giantbomb.com/api/',
        key: 'ca21f96f411cc413f9234dbec4a20f729ca3fb2b',
    }

    let musicApiData = {
        clientId: '9f0ad941c5394f4ca74562dbeaa29135',
        clientSecret: '112c92661a7b4d779c01b08c3210ea94',
    }

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

    function backToSearch() {
        hideSection(elements.resultSection);
        showSection(elements.searchSection);
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
                console.log(data);
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

        hideSection(elements.searchSection);
        showSection(elements.gamesSection);
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
                    displayGameData(data.results);
                });
        }
    }

    function displayGameData(gameData) {
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

        let gameElem = $(`
            <div class="game-image">
                <img src="${gameInfo.img}" alt="${gameInfo.name}">
            </div>
            <ul class="game-info-list">
                <li class="info-item game-name">${gameInfo.name}</li>
                <li class="info-item release-date">Release Date: ${gameInfo.releaseDate}</li>
                <li class="info-item game-desc">Description: ${gameInfo.deck}</li>
                <li class="info-item game-genre">Genre: ${gameInfo.genres.reduce((accum, value, index) => {
                    return accum + (index !== gameInfo.genres.length ? ', ' : '') + value;
                })}</li>
                <li class="info-item platform-icon">${gameInfo.platforms.reduce((accum, value, index) => {
                    return accum + (index !== gameInfo.platforms.length ? ', ' : '') + value;
                })}</li>
            </ul>
        `);

        elements.gameResults.text('').append(gameElem);

        hideSection(elements.gamesSection);
        showSection(elements.resultSection);
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

    async function getRecommendationByGenre() {
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

        console.log(data);
        return data;
    }

    function displayMusicData() {
        if (!elements.musicShuffle.attr('disabled')) {
            elements.musicShuffle.attr('disabled', true);
        }

        getRecommendationByGenre()
            .then((data) => {
                // console.log(data.tracks);
                let tracksList = elements.musicResults.find('.js-tracks-list').text('');

                data.tracks.forEach((item) => {
                    let albumName = item.album.name;
                    let thumbUrl = item.album.images[2].url;
                    let releaseYear = dayjs(item.release_date, 'YYYY-MM-DD').format('YYYY');
                    let artists = item.artists.map((item) => {
                        return item.name;
                    });
                    let track = {
                        name: item.name,
                        url: item.external_urls.spotify,
                    }
                    let previewUrl = item.preview_url;
                    let trackPreview = ``;

                    if (previewUrl !== null) {
                        trackPreview = `
                            <div class="track-preview js-track-preview">
                                <i class="material-icons small">play_circle_outline</i>
                                <audio src="${previewUrl}">
                            </div>
                        `;
                    }

                    let trackItem = $(`
                        <li class="track-item">
                            ${trackPreview}
                            <a href="${track.url}" target="_blank" rel="external">
                                <div class="thumb">
                                    <img src="${thumbUrl}" alt="${albumName}">
                                </div>
                                <div class="track-info">
                                    <p class="track-name">${track.name}</p>
                                    <p class="about-track">
                                        <span class="artists">${artists.reduce((accum, value, index) => {
                                            return accum + (index !== artists.length ? ', ' : '') + value;
                                        })}</span>
                                        <span class="album">${albumName}</span>
                                        <span class="separator">&bull;</span>
                                        <span class="release-year">${releaseYear}</span>
                                    </p>
                                </div>
                            </a>
                        </li>
                    `);

                    tracksList.append(trackItem);
                });

                elements.musicResults.on('click', '.js-track-preview', playMusicPreview);
                elements.musicResults.removeClass('invisible');
                elements.musicShuffle.removeAttr('disabled');
            });
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

    function init() {
        console.log('%c Init', 'color: #0455BF;');

        elements.searchForm.on('submit', searchGames);
        // Initialize collapse button
        $('.sidenav').sidenav();
        displayMusicData();
        elements.musicShuffle.on('click', displayMusicData);
        elements.gameShuffle.on('click', backToSearch);
    }

    init();
});
