<template lang="pug">
    span.svHint(alt="{info}", title="{info}") ?
</template>

<script>
    export let info = 'N/A';
</script>

<style lang="scss" global>
    @import '../App';

    .svHint {
        color: rgba(255,191,0, .4);
        font-size: bold;
        cursor: pointer;
        position: relative;
        margin-left: .5em;
        margin-right: .5em;
        transition: color 250ms;

        &::before {
            content: '(';
            position: absolute;
            opacity: 0;
            left: 0;
            transition: opacity 250ms, left 250ms;
        }

        &::after {
            content: ')';
            position: absolute;
            opacity: 0;
            right: 0;
            transition: opacity 250ms, right 250ms;
        }

        &:hover {
            color: rgb(255,191,0);

            &::before {
                opacity: 1;
                left: -.5em;
            }

            &::after {
                opacity: 1;
                right: -.5em;
            }
        }
    }
</style>
