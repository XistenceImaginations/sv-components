<template lang="pug">
    .svDialog({id},class:svDialog--visible="{isShown}",class="{styleType}")
        .svDialog__window
            .svDialog__window_title
                .svDialog__window_title_text {title}
                span.svDialog__window_title_icon(on:click="{close}",class="icon-cancel")
            .svDialog__window_content {text}
</template>

<script>
    // TODO Dialog, Notifaction have a lot in common, create sort of abstract base component to extend from
    export let id   = undefined;
    export let type = undefined;
    //TODO option to make dialog soft-modal (clicking outside closes), tough-modal (needs specific action), or overlay (no faded background, just dialog)

    let isShown = false;
    let title   = 'N/A';
    let text    = 'N/A';

    $: styleType = type ? 'svDialog--' + type :'';

    function close(e) {
        isShown = false;
    }

    window.eventBus.bind('sv-dialog', e => {
        // if id isn't set here we use this dialog as global one. if any event arrives that either ha no id, we use a possible title/text and show the global dialog
        // in all other cases id's have to match and an id must be prodived via event;
        isShown = id === e.detail.id;
    });
    // TODO way to ad-hoc-creation of Dialog w/o adding the Dialog explicitely in code (using an event)

    /**
     * This is a listener for the global event, as theoretically there
     *  should only be one instance of Dialog. Practically there could be
     *  many, they might all be triggered then by this.
     */
    // TODO merge with event-bind above
    window.eventBus.bind('sv-dialog', e => {
        title = e.detail.title || 'N/A';
        text = e.detail.text || 'N/A';
        type = e.detail.type || undefined;
        isShown = true;
    });

    /**
     * This defines a global method to trigger a dialog, as there should be only
     *  one dialog that is filled with information for the time being.
     */
    window.dialog = window.dialog || {};
    window.dialog.show = e => {
        if (e.target){
            window.eventBus.dispatch('sv-dialog', {
                title: e.target.dataset.title,
                text : e.target.dataset.text,
                type : e.target.dataset.type});
        }
    };
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
        width: 100vw;
        height: 100vh;
        background-color: transparent;
        z-index: $z-ui;
        overflow-y: scroll;
        transition: background-color var(--animation-duration);
        display: block;
        pointer-events: none;

        &--visible {
            pointer-events: all;
            background-color: var(--overlay-dark);

            .svDialog__window {
                transform: translate(-50%, -50%);
                opacity: 1;
            }
        }

        &__window {
            display: inline-block;
            position: absolute;
            min-width: 320px; // TODO make configurable
            min-height: 160px; // TODO make configurable
            top: 50%; /*TODO later we want to place it centered as long it fits inside the view, otherwise at top 0 plus scrolling*/
            left: 50%;
            background-color: var(--bg-color);
            border: 1px solid gray;
            transform: translate(-50%, calc(-50% - 20px));
            opacity: 0;
            box-shadow: var(--box-shadow-dark);
            transition: transform var(--animation-duration), opacity var(--animation-duration);
            border-radius: 4px;

            &_title {
                display: flex;
                padding: 8px; // TODO em

                &_text {
                    flex-grow: 1;
                    font-weight: bolder;
                }
                &_icon {
                    flex-grow: 0;

                    &:before {
                        line-height: 1.5em;
                    }
                }
            }

            &_content {
                padding: 8px; // TODO em
            }
        }

        // TODO use x.js/shaping for this
        &--info {
            .svDialog {
                &__window {
                    background: linear-gradient(
                        var(--primary-color-alpha) 0,
                        var(--bg-color) 3em
                    );
                    border: 1px solid var(--primary-color);
                }
            }
        }

        &--error {
            .svDialog {
                &__window {
                    background: linear-gradient(
                        var(--negative-color-alpha) 0,
                        var(--bg-color) 3em
                    );
                    border: 1px solid var(--negative-color);
                }
            }
        }

        &--success {
            .svDialog {
                &__window {
                    background: linear-gradient(
                        var(--positive-color-alpha) 0,
                        var(--bg-color) 3em
                    );
                    border: 1px solid var(--positive-color);
                }
            }
        }

        &--confirm {
            .svDialog {
                &__window {
                    background: linear-gradient(
                        var(--secondary-color-alpha) 0,
                        var(--bg-color) 3em
                    );
                    border: 1px solid var(--secondary-color);
                }
            }
        }
    }

    /* TODO apply a body-class to prevent scrolling when this dialog is shown*/
    /*:global(body) {
        overflow: hidden;
    }*/
</style>
