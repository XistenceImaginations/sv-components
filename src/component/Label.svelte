<!--
    A simple label element that also has some specific styling.
-->
<template lang="pug">
    .svLabel
        slot
</template>

<style lang="scss" global>
    @import '../App';

    $svLabelLineWidth: 30px;
    $svLabelLineToTextGap: 10px;
    $svLabelLineFullWidth: $svLabelLineWidth + $svLabelLineToTextGap;
    $svLabelLinesWidth: $svLabelLineFullWidth * 2;

    .svLabel {
        position: absolute;
        top: 90%; // TODO this is very specific in combination with Overlay. It shouldn't
        left: 50%;
        white-space: normal;
        display: inline-block;
        transform: translate(-50%, -50%);
        text-shadow: var(--text-shadow-dark);
        font-weight: bold;
        pointer-events: none;
        max-width: calc(100% - #{$svLabelLinesWidth});

        &::before,
        &::after {
            content: '';
            display: inline-block;
            position: absolute;
            transform: translateX(-#{$svLabelLineFullWidth});
            top: 50%;
            width: $svLabelLineWidth;
            height: 1px;
            border-bottom: 2px solid var(--fg-color);
            opacity: .5;
        }
        &::after {
            transform: translateX(#{$svLabelLineToTextGap});
        }
    }
</style>
