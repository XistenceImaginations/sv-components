<!--
    Component for render the page. We should set up basic layout definitions here.
-->
<template lang="pug">
    .svPage
        slot
</template>

<style lang="scss" global>
    @import '../App';

    $svPagePaddings: ('xs': 0, 'sm': 0 1em, 'md': 0 1em, 'lg': 0 2em);

    .svPage {
        padding: map-get($svPagePaddings, 'xs');
    }

    @mixin bp($bps) {
        @each $bp in $bps {
            @media only screen and (min-width: #{bp($bp)}) {
                .svPage {
                    padding: map-get($svPagePaddings, $bp);
                }
            }
        }
    }

    @include bp($breakPoints);
</style>
