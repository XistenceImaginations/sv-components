<template lang="pug">
    .svNavBar
        .svNavBar__title
            .svNavBar__title_text
                slot(name="title")
            .svNavBar__title_icons
                slot(name="icons")
</template>

<style lang="scss" global>
    @import '../App';

    $navHeights: ('xs': 6rem, 'sm': 5rem, 'md': 4rem, 'lg': 5rem);

    .svNavBar {
        font-size: map-get($navHeights, 'xs');
        //position: fixed;
        width: 100%; // 100vw;
        //top: 0;
        //left: 0;
        //z-index: 1;
        font-weight: bold;
        background: var(--bar-gradient);
        transition: height    var(--animation-duration-slow),
                    font-size var(--animation-duration-slow);

        &__title {
            display: flex;
            width: 100%;
            min-height: 1em;
            line-height: 1em;
            padding: .75em 1em 0 1em;
            font-size: .35em;
            text-shadow: var(--text-shadow-dark);

            &_text {
                flex-grow: 1;
            }

            &_icons {
                flex-grow: 0;
            }
        }
    }

    @mixin bp($bps) {
        @each $bp in $bps {
            $size: map-get($navHeights, $bp); // fetches the height for the nav

            @media only screen and (min-width: #{bp($bp)}) { // bp() from App.scss return a PX-value for a given breakpoint-key
                .svNavBar {
                    height: $size;
                    font-size: $size;
                }
            }
        }
    }

    @include bp($breakPoints);

    html:not([data-scroll='0']) {
        .svNavBar {
            height: 2.5rem; // TODO specific values for all breakpoints
            font-size: 2.5rem; // TODO specific values for all breakpoints
        }
    }
</style>
