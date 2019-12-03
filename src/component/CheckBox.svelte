<template lang="pug">
    label.svCheckBox
        input(type="{inputType}",{value},{checked},{disabled},{name})
        span.svCheckBox__checkmark
        span.svCheckBox__label
            slot
</template>

<script>
    export let value = '';
    export let checked = false;
    export let disabled = false;
    export let type = 'check';
    export let name = undefined;

    $: inputType = type === 'check' ? 'checkbox': 'radio';
</script>

<style lang="scss" global>
    @import '../App';

    $svCheckBoxInactive: var(--text-color);
    $svCheckBoxInactiveHover: var(--text-color-light);
    $svCheckBoxActive: var(--positive-color);
    $svCheckBoxActiveHover: var(--positive-color-light);
    $svCheckBoxText: var(--text-color);
    $svCheckBoxTextHover: var(--text-color-light);
    $svCheckBoxDisabled: var(--negative-color-light);

    .svCheckBox{
        display: inline-block;
        position: relative;
        cursor: pointer;
        font-size: 1em;
        user-select: none;
        min-width: 1em;
        min-height: 2em;
        color: $svCheckBoxText; // var(--fg-form);

        & > * {
            display: inline-block;
            vertical-align: middle;
        }

        & input {
            position: absolute;
            opacity: 0;
            height: 0;
            width: 0;

            &:checked {
                &:not(:disabled) ~ .svCheckBox__checkmark:after {
                    border-color: $svCheckBoxActive; // $theme_color_prime;
                }

                & ~ .svCheckBox__checkmark:after {
                    left: .4em;
                    top: -.2em;
                    width: .5em;
                    height: 1em;
                    border-width: 0 2px 2px 0;
                    border-radius: 0;
                    transform: rotate(45deg);
                }
            }

            &:disabled {
                cursor: not-allowed;

                & ~ .svCheckBox__label {
                    color: $svCheckBoxDisabled; // var(--bg-input-disabled);
                    cursor: not-allowed;
                }

                & ~ .svCheckBox__checkmark:after {
                    border-color: $svCheckBoxDisabled; // var(--bg-input-disabled);
                    cursor: not-allowed;
                }
            }
        }

        & input[type=radio] {
            & ~ .svCheckBox__checkmark:after {
                border-radius: 50%; // TODO em?
            }

            &:checked ~ .svCheckBox__checkmark:after {
                border-radius: 50%; // TODO em?
                background-color: $svCheckBoxActive;
                transform: rotate(0deg);
                border-width: 2px;
                left: .25em;
                top: .25em;
                width: .5em;
                height: .5em;
            }

            &:checked:disabled ~ .svCheckBox__checkmark:after {
                background-color: $svCheckBoxDisabled;
            }
        }

        &__checkmark {
            position: relative;
            height: 1.25em;
            width: 1.25em;
            transition: all 0.3s;
            margin-right: .5em;

            &:after {
                border-color: $svCheckBoxInactive; // green; // var(--fg-form);
                content: "";
                position: absolute;
                transition: all 0.3s;
                left: 0;
                top: 0;
                width: 1em;
                height: 1em;
                border: solid $svCheckBoxInactive; // var(--fg-form);
                border-width: 2px 2px 2px 2px;
                border-radius: 3px; // TODO em?
                transform: rotate(0deg);
            }
        }

        &__label {
            transition: all 0.3s;
            padding-right: 1em;
        }

        &:hover {
            & input:checked:not(:disabled) ~ .svCheckBox__checkmark:after {
                border-color: $svCheckBoxActiveHover; // orange; // var(--fg-form-highlight);
            }

            & input:not(:checked):not(:disabled) ~ .svCheckBox__checkmark:after {
                border-color: $svCheckBoxInactiveHover; // orange; // var(--fg-form-highlight);
            }

            & input:not(:disabled) ~ .svCheckBox__label {
                color: $svCheckBoxTextHover; // var(--fg-form-highlight);
            }
        }
    }
</style>
