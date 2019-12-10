<!--
    Ok, here's the deal: label acts as placeholder as we can shift it out of the input
        while we can't do this with the real placeholder (it is clipped).
    But to show/hide the placeholder PLUS to show it constantly when there is text (the
        placeholder acts as 'label' as well), we need an indicator. We use the origin
        placeholder - which isn't rendered at least - but to make CSS-selector work with
        that we have to enter a 'dummy'-value, which can't be just an empty string of
        length == 0. So thats the reason for this ' '-String.
-->
<template lang="pug">
    span.svField
        input.svField__input(placeholder=' ',{value},{disabled},{type})
        label.svField__label {placeholder}
</template>

<script>
    export let placeholder = ' ';
    export let value       = '';
    export let disabled    = false;
    export let type        = 'text';

    // TODO error and invalid state to be shown
</script>

<style lang="scss" global>
    @import '../App';

    .svField {
        display: inline-block;
        position: relative;

        & + .svField {
            margin-left: 8px; // TODO use em
        }

        &__input {
            margin: 0;
            padding: 0.4em;
            outline: none;
            border: none;
            border-bottom: 1px solid var(--text-color-alpha);
            border-radius: 3px;
            background-color: transparent;
            transition: background-color var(--animation-duration);
            color: var(--text-color);

            &:not(:disabled) {
                &:hover {
                    background-color: var(--element-bg-color-alpha);
                    border-color: var(--primary-color-apha);
                }

                &:focus {
                    background-color: var(--element-bg-color);
                    border-color: var(--primary-color);
                }

                &:not(:placeholder-shown) ~ .svField__label,
                &:hover ~ .svField__label,
                &:focus ~ .svField__label {
                    color: var(--text-color);
                    font-size: .875em;
                    transform: translateY(-2em);
                }
            }

            &:disabled {
                cursor: not-allowed;
                border-color: var(--negative-color-alpha);
                color: var(--negative-color);

                &:not(:placeholder-shown) ~ .svField__label {
                    display: none;
                }

                & ~ .svField__label {
                    color: var(--negative-color);
                }
            }
        }

        &__label {
            padding: 0.4em;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            pointer-events: none;
            color: var(--text-color-alpha);
            transition: color     var(--animation-duration),
                        transform var(--animation-duration),
                        font-size var(--animation-duration);
        }
    }
</style>
