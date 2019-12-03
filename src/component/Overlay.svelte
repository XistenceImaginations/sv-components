<!--
    Overlay acts as container but also as layer to be put over some content of a container.
-->
<template lang="pug">
    .svOverlay
        .svOverlay__content
            slot
</template>

<style lang="scss" global>
    @import '../App';

    $svOverlayAnimationDistance: 24px;
    $svOverlayAnimationTime: 275ms;
    $svOverlayGradientStart: change-color($themeShadow, $alpha: 0);
    $svOverlayGradientEnd: change-color($themeShadow, $alpha: .5);

    .svTile.hovered .svOverlay{ // TODO HACK, as events and props aren't sufficient as far as it can be seen - for now
        opacity: 1;
        transform: translateY(0);
    }

    .svOverlay {
        position: absolute;
        top: 0;
        left: 0;
        bottom: -$svOverlayAnimationDistance;
        right: 0;
        overflow: hidden;
        display: inline-block;
        //background-color: var(--overlay-dark);
        background: linear-gradient(180deg, $svOverlayGradientStart calc(100% - 150px), $svOverlayGradientEnd 100%);
        opacity: 0;
        transition: opacity $svOverlayAnimationTime, transform $svOverlayAnimationTime;
        transform: translateY(-#{$svOverlayAnimationDistance});
        pointer-events: none;

        &__content {
            position: absolute;
            top: 0;
            left: 0;
            bottom: $svOverlayAnimationDistance;
            right: 0;
        }

        &:hover {
            opacity: 1;
            transform: translateY(0);
        }
    }

    :global(body.debug) {
        & .svOverlay {
            background-color: var(--debug-color);
        }
    }
</style>
