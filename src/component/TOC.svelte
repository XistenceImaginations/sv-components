<template lang="pug">
    .svToc
        ul
            +each('titles as title, i')
                li.svToc__entry(on:click='{jumpTo}',index='{i}',class='{title.level}') {title.name}
        .svToc__marker
</template>

<script>
    // TODO - document: scroll into view when clicking entry
    // TODO - marker: scroll into view

    let titles = [];
    let area;
    let titleInFocus;

    function jumpTo(e){
        let index = parseInt(e.target.getAttribute('index'));
        let bounds = titles[index].elm.getBoundingClientRect();

        window.scrollTo(0, bounds.top + 30);
    }

    function updateMarker(){
        let viewHeightHalf = window.innerHeight / 2;
        let entries = Array.from(document.querySelectorAll('.svToc__entry'));
        let container = document.querySelector('.svToc');
        let marker = document.querySelector('.svToc__marker');
        let found;

        titles.forEach(title => {
            let bounds = title.elm.getBoundingClientRect();

            if (bounds.top >= 0 && bounds.top < viewHeightHalf) {
                found = title;
            }
        });

        if (found && found !== titleInFocus) {
            titleInFocus = found;

            if (titleInFocus) {
                let containerBounds = container.getBoundingClientRect();
                let entryBounds = entries[titleInFocus.index].getBoundingClientRect();
                
                marker.style.top = (entryBounds.top - containerBounds.top) + 'px';
                marker.style.height = entryBounds.height + 'px';
    
                let markerBounds = marker.getBoundingClientRect();
                container.scrollTo(0, markerBounds.top);
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        let index = 0;

        Array
            .from(document.querySelectorAll('.svPage .svTitle'))
            .forEach(title => {
                let regex = /svTitle--size(\d+)/;
                let match = regex.exec(title.getAttribute('class'));

                if (match && match[1]) {
                    titles = [...titles, {
                        elm: title,
                        level: 'svToc__entry--' + parseInt(match[1]),
                        name: title.innerText,
                        index:  index
                    }];

                    index++;
                }
            });

        area = document.createElement('div');
        area.style.position = 'sticky';
        area.style.backgroundColor = 'rgba(255,0,0,.1)';
        area.style.zIndex = '10001';
        area.style.top = '0';
        area.style.left = '0';
        area.style.width = '100%';
        area.style.height = '50%';

        document.body.appendChild(area);

        updateMarker();
    });
</script>

<style lang="scss" global>
    @import '../App';

    .svToc {
        position: relative;

        ul {
            list-style-type: none;
            padding-left: 10px;
        }

        &__entry {
            padding: .25em 0;
            font-weight: bold;

            &--1 {
                font-size: .95em;
                padding-left: .5em;
            }
            &--2 {
                font-size: .9em;
                padding-left: 1em;
            }
            &--3 {
                font-size: .85em;
                padding-left: 1.5em;
            }
            &--4 {
                font-size: .8em;
                padding-left: 2em;
            }
            &--5 {
                font-size: .75em;
                padding-left: 2.5em;
            }
            &--6 {
                font-size: .7em;
                padding-left: 3em;
            }
        }

        &__marker {
            position: absolute;
            top: 0;
            left: 0;
            width: 2px;
            height: 20px;
            background-color: rgb(0,127,255);
            transition: top 250ms, height 250ms;
        }
    }
</style>

<svelte:window on:scroll={updateMarker} />
