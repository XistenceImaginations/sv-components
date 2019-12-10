<template lang="pug">
    .svWiper(on:scroll="{updateView}",bind:this="{elm}")
        .svWiper__content(bind:this="{content}")
            slot
        .svWiper__info(bind:this="{info}") {index} / {count}
</template>

<script>
    let elm;
    let content;
    let info;
    let timer;
    let locked;
    let index = 0;
    let count = 0;

    function init (e) {
        // We need to fit the content to the amount of childs being placed in there.
        // But as the childs are positioned absolute they're out of the document
        //  flow so we give the 'content' manually a height, so it is scrollable.
        content.style.height = 'calc(100% * '+content.childElementCount + ')';

        updateInfo();
        setInterval(correctPos, 100);

        window.eventBus.dispatch('sv-swiper');
    }

    function updateInfo () {
        let top = elm.scrollTop;
        let height = elm.getBoundingClientRect().height;
        let viewHeight = content.getBoundingClientRect().height;

        info.style.top = top + 'px';

        index = Math.ceil((top - (height/2)) / height) + 1; // Note: we switch the index when we get over an imaginary centered line (that is the 'height/2' for)!
        count = Math.ceil(viewHeight / height);
    }
    function updateView (e) {
        updateInfo();

        // A timer to check if the user has stop scrolling (each scroll 'interrupts
        //  the timer by setting the value back to 5 (5 * 100ms == 500ms))
        timer = locked ? timer : 5;

        // TODO pressing mouse down (as the user 'holds' the scrollbar) should freeze/interrupt the timer as well
        //       alternatively we remove the scrollbar (still - swiping can create the same fuss)

        window.eventBus.dispatch('sv-swiper');
    }

    function correctPos () { // called by interval
        if (timer>0) {
            timer--;

            if (timer === 0) {
                // Timer reached 0, now it is time to act...
                locked = true; // locking, we want to prevent the timer during our calculation
                let top = elm.scrollTop;
                let height = elm.getBoundingClientRect().height;
                let half = height / 2;

                // This is a pure delta about a clean layer-by-layer position and the real scroll position.
                // The target is to 'smoothly' scroll a range of this 'delta' until we reached the next 'clean'
                //  layer position.
                let mod = top % height; // the delta
                let pos = top - mod; // that is the clean layer position, we need it in our calculation later
                let moveUp = mod > half; // here we check if we want to scroll up or down to the next clean position.

                let move = setInterval(() => { // this is to animate our scrolling
                    let endReached = false;

                    if (moveUp) {
                        if (mod < height) {
                            mod += Math.min(5, height - mod);
                        }else {
                            mod = height;
                            endReached = true;
                        }
                    } else {
                        if (mod > 0) {
                            mod -= Math.min(5, mod);
                        }else {
                            mod = 0;
                            endReached = true;
                        }
                    }

                    elm.scrollTop = (pos + mod);

                    if (endReached) {
                        clearInterval(move);

                        locked = false;
                    }
                }, 10);
            }
        }
    }
</script>

<style lang="scss" global>
    @import '../App';

    .svWiper {
        width: 100%;
        height: 100%;
        position: relative;
        overflow-x: hidden;
        overflow-y: auto;

        //&__content {
        //}

        &__info {
            position: absolute;
            top: 0;
            left: 0;
            background-color: var(--bg-color);
            color: var(--fg-color);
            padding: .5em; // TODO
            z-index: $z-float;
        }
    }
</style>

<svelte:window on:load={init}></svelte:window>
