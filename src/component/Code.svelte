<template lang="pug">
    code.svCode
        slot
</template>

<style lang="scss" global>
    @import '../App';

    .svCode {
        background-color: rgb(31,31,31);
        color: rgb(127,191,255);
        font-family: monospace;
        border-radius: 4px;
        padding: .25em .5em;
        border: 1px solid rgba(191,191,191,.2);
        display: inline-block;
    }
</style>
