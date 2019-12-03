<template lang="pug">
    .svDialog({id},class:svDialog--visible="{isShown}")
        .svDialog__window
            .svDialog__window_title
                .svDialog__window_title_text Dialog Title
                span.svDialog__window_title_icon(on:click="{close}",class="icon-cancel")
            .svDialog__window_content
                slot
</template>

<script>
    export let id = undefined;

    let isShown = false;

    window.eventBus.bind('sv-dialog', e => isShown = id === e.detail.id);

    function close(e) {
        isShown = false;
    }
</script>

<style lang="scss" global>
    @import '../App';

    @keyframes svDialogShown {
        0%   { display: block; opacity: 0; }
        100% { display: block; opacity: 1; }
    }

    .svDialog {
        position: fixed;
        top: 0;
        left: 0;
        //bottom: 0;
        //right: 0;
        width: 100vw;
        height: 100vh;
        background-color: transparent;
        z-index: 10000;
        overflow-y: scroll;
        transition: background-color 250ms;
        //opacity: 0;
        //display: none;
        display: block;
        pointer-events: none;

        &--visible {
            pointer-events: all;
            //display: block;
            background-color: var(--overlay-dark);
            //animation: svDialogShown 250ms;

            .svDialog__window {
                transform: translate(-50%, -50%);
                opacity: 1;
                //background-color: rgba(255,0,0,.75);
            }
        }

        &__window {
            padding-top: 0;
            padding-bottom: 8px;
            padding-left: 8px;
            padding-right: 8px;
            display: inline-block;
            position: absolute;
            min-width: 100px;
            min-height: 100px;
            top: 50%; /*TODO later we want to place it centered as long it fits inside the view, otherwise at top 0 plus scrolling*/
            left: 50%;
            background-color: var(--bg-color);
            //background-color: rgba(0,0,0,.75);
            border: 1px solid gray;
            transform: translate(-50%, calc(-50% - 20px));
            //transform: translate(-50%, -50%);
            opacity: 0;
            box-shadow: var(--box-shadow-dark);
            transition: transform 250ms, opacity 250ms;

            &_title {
                display: flex;

                &_text {
                    flex-grow: 1;
                }
                &_icon {
                    flex-grow: 0;
                }
            }
        }
    }

    /* TODO apply a body-class to prevent scrolling when this dialog is shown*/
    /*:global(body) {
        overflow: hidden;
    }*/
</style>
