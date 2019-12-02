<template lang="pug">
    .svButton(class="{styleType}")
        .svButton__text(data-label="{label}",bind:this="{elm}")
            slot
</template>

<script>
    export let type;

    let elm;

    $: styleType = type.split(' ').map(s => 'svButton--' + (s || 'default')).join(' ');
    $: label     = elm ? elm.innerText : '';

    // TODO add states: 'disabled', 'error'. Based on some states change/prevent event behaviour(s)
</script>

<style lang="scss" global>
    @import '../App';

    $svButtonFlashSize: 8px;

    @keyframes foo {
        0%   { visibility: visible; top: 0; left: 0; bottom: 0; right: 0; opacity: .75; border-radius: 0; }
        100% { visibility: visible; top: -$svButtonFlashSize; left: -$svButtonFlashSize; bottom: -$svButtonFlashSize; right: -$svButtonFlashSize; opacity: 0; border-radius: $svButtonFlashSize; }
    }

    .svButton {
        background-color: transparent; /*TODO use theme light/dark aspects*/
        border: 1px solid rgba(0, 0, 0, .5); /*TODO use theme light/dark aspects*/
        color: var(--fg-color);
        font-weight: bold;
        display: inline-block;
        padding: .25em .75em;
        border-radius: 2px;
        cursor: pointer;
        transition: background-color 250ms, border 250ms;
        position: relative;

        &:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            z-index: -1;
            visibility: hidden;
        }

        & + .svButton {
            margin-left: 8px; // TODO use em
        }

        &:hover {
            background-color: rgba(255, 255, 255, .2); /*TODO use theme light/dark aspects*/
            border: 1px solid rgba(0, 0, 0, .7); /*TODO use theme light/dark aspects*/

            .svButton {
                &__text {
                    transform: translateY(-calc(100%));
                }
            }
        }

        &__text {
            transition: transform 250ms;
            transform: translateY(0);
            position: relative;
            overflow: hidden;

            &::after {
                content: attr(data-label);
                position: absolute;
                top: 0;
                left: 0;
                transform: translateY(100%);
                transition: transform 250ms;
            }
        }

        &--default { /*TODO create mixin*/
            &:before {
                background-color: var(--fg-color); // TODO default
            }
        }

        &--primary { /*TODO create mixin*/
            background-color: var(--primary-color);
            border: 1px solid var(--primary-color-dark);
            color: var(--primary-text-color);

            &:hover {
                background-color: var(--primary-color-light);
                border: 1px solid var(--primary-color);
                // TODO color
            }
            &:before {
                background-color: var(--primary-color-light);
            }
        }

        &--secondary { /*TODO create mixin*/
            background-color: var(--secondary-color);
            border: 1px solid var(--secondary-color-dark);
            color: var(--secondary-text-color);

            &:hover {
                background-color: var(--secondary-color-light);
                border: 1px solid var(--secondary-color);
                // TODO color
            }
            &:before {
                background-color: var(--secondary-color-light);
            }
        }

        &--disabled { /*TODO create mixin*/ // TODO define an additional 'state' for button, take care the style and state can mix (w/o defining all style variations manually)
            background-color: var(--negative-color);
            border: 1px solid var(--negative-color-dark);
            color: var(--negative-text-color);
            cursor: not-allowed;

            &:hover {
                background-color: var(--negative-color-light);
                border: 1px solid var(--negative-color);
            }
            &:before {
                background-color: var(--negative-color-light);
            }
        }

        &--blinking {
            &:before {
                animation: foo 500ms infinite;
            }
        }
    }
</style>
