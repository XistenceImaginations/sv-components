<template lang="pug">
    .svCard
        FlipPanel
            .svCard__front(slot="front")
                div(style="grid-area:content;border:1px solid rgba(0,0,0,.5);background-color:rgb(127,127,127);")
                    slot(name="image")
                div(style="grid-area:desc;border:1px solid rgba(0,0,0,.5);background-color:rgb(127,127,127);")
                    slot(name="shortDesc")
            .svCard__back(slot="back")
                div(style="grid-area:content;border:1px solid rgba(0,0,0,.5);background-color:rgb(127,127,127);")
                    slot(name="longDesc")
</template>

<script>
    import FlipPanel from './FlipPanel.svelte';
</script>

<style lang="scss" global>
    @import '../App';

    $svCardBorder: .875em;
    $svCardSeparator: .875em;

    .svCard {
        display: inline-block;
        width: calc(6.3em * 2.5);
        height: calc(8.8em * 2.5);
        position: relative;

        &__front,
        &__back {
            position: relative;
            width: 100%;
            height: 100%;
            //padding: 1em;
            border-radius: .5em;
            overflow: hidden;
            background-color: rgb(95,95,95); // TODO
            display: grid;
            justify-items: stretch;
            align-items: stretch;
        }

        &__front {
            grid-template-columns: $svCardBorder auto $svCardBorder;
            grid-template-rows: $svCardBorder auto $svCardSeparator auto $svCardBorder;
            grid-template-areas:
                "b1 b1 b1"
                "b2 content b3"
                "b4 b4 b4"
                "b5 desc b6"
                "b7 b7 b7";
        }

        &__back {
            grid-template-columns: $svCardBorder auto $svCardBorder;
            grid-template-rows: $svCardBorder auto $svCardBorder;
            grid-template-areas:
                "b1 b1 b1"
                "b2 content b3"
                "b4 b4 b4";
        }

        & + .svCard {
            margin-left: 8px; // TODO use em
        }
    }
</style>
