<template lang="pug">
    - var optional = 'This attribute is optional.'
    - var flag     = 'This attribute needs no value, just the key (instead of \'foo="bar"\', just use \'foo\').'
    SideBar
        Title(size="2") SideBar
        Section
            Article(title="Sidebar Content") Some side bar content
        Grid
            Tile(width="4",height="4",clip="{false}",gap="2px")
                FlipPanel
                    .wrapper(slot="front",style="background-color: var(--bg-color);")
                        .AppIcon: Icon(icon="phone-squared")
                    .wrapper(slot="back",style="background-color: var(--bg-color-light);")
                        .AppIcon.AppIcon--active: Icon(icon="phone-squared")
            Tile(width="4",height="4",clip="{false}",gap="2px")
                FlipPanel
                    .wrapper(slot="front",style="background-color: var(--bg-color);")
                        .AppIcon: Icon(icon="pinterest-squared")
                    .wrapper(slot="back",style="background-color: var(--bg-color-light);")
                        .AppIcon.AppIcon--active: Icon(icon="pinterest-squared")
            Tile(width="4",height="4",clip="{false}",gap="2px")
                FlipPanel
                    .wrapper(slot="front",style="background-color: var(--bg-color);")
                        .AppIcon: Icon(icon="rss-squared")
                    .wrapper(slot="back",style="background-color: var(--bg-color-light);")
                        .AppIcon.AppIcon--active: Icon(icon="rss-squared")
            Tile(width="8",height="4",clip="{false}",gap="2px")
                FlipPanel
                    .wrapper(slot="front",style="background-color: var(--bg-color);")
                        .AppIcon: Icon(icon="pencil-squared")
                    .wrapper(slot="back",style="background-color: var(--bg-color-light);")
                        .AppIcon.AppIcon--active: Icon(icon="pencil-squared")
            Tile(width="4",height="4",clip="{false}",gap="2px")
                FlipPanel
                    .wrapper(slot="front",style="background-color: var(--bg-color);")
                        .AppIcon: Icon(icon="tumblr-squared")
                    .wrapper(slot="back",style="background-color: var(--bg-color-light);")
                        .AppIcon.AppIcon--active: Icon(icon="tumblr-squared")

    Dialog
    Header
        NavBar
            span(slot="title")
                img(on:click="{sidebar.show}",src="/assets/icons/app-icon.jpg",style="width:1.5em;height:1.5em;vertical-align:text-bottom;margin-right:.5em")
                span Svelte Components Test Page
            div(slot="icons")
                IconBar
                    Icon(title='Facebook'  ,url="http://facebook.com"  ,icon="facebook")
                    Icon(title='Tumblr'    ,url="http://tumblr.com"    ,icon="tumblr")
                    Icon(title='Artstation',url="http://artstation.com",icon="help")
                    Icon(title='DeviantArt',url="http://deviantart.com",icon="deviantart")
        Notification(close="2.5s")
        Notification(close="click",floatable)
    Page
        PageBlock
            Title(size="1") About this page
            Section
                | This is a test page for all SV-Components, to show them in an overview and to test them.<br>
                | Main target of this little project is to <b style="color:rgb(0,127,0)">mess around, using
                | Svelte with current CSS/JS-features</b> and <b style="color:rgb(127,0,0);text-decoration:line-through;">
                | not to be fully-cross-browser-on-all-device-in-space-super-duper-stuff</b>.<br>
                | If you're looking for examples <b style="color:rgb(0,127,0)">how some stuff can(!) be done (JS/CSS/PUG/SVELTE)</b>, be my guest.<br>
                | If you're looking for some <b style="color:rgb(127,0,0);text-decoration:line-through;">ready-to-deploy fully-fledged super framework</b> - nah, don't use this here, there are better ones.<br>
                | Note that areas that are <b class="--hatched">'hatched'</b> in their style, are things to be done.<br>
                | <br>
                | For the time being, this code is 'laboratory'-code. That said expect following things:
                ul
                    li Code might break
                    li Page might not work in any browser/-version (i'm looking at you IE(11) & Safari)
                    li Not created under aspects of 'mobile-first'. I'm mean... it might work and do things... or not...
                    li Not everything is feature complete
                    li Not everything is (well)documented (here and/or in code)
                    li Not ment for production... really
                span So, let's go...

            Title(size="2") Titles
            Section
                Description(title="About titles")
                    TextBlock(title="Syntax:")
                        | <Code>Title(size="[SIZE]") [TEXT]</Code>
                    TextBlock(title="Parameters:")
                        | <Code>
                        | size = 1 | 2 | 3 | 4 | 5 | 6 <Hint info="#{optional}"/><br>
                        | </Code>
                    TextBlock(title="Examples:")
                        Title(size="1") Title Size 1
                        Title(size="2") Title Size 2
                        Title(size="3") Title Size 3
                        Title(size="4") Title Size 4
                        Title(size="5") Title Size 5
                        Title(size="6") Title Size 6

            Title(size="2") Buttons
            Section
                Description(title="Single buttons")
                    TextBlock(title="Syntax:")
                        | <Code>Button(icon="[ICON]",type="[TYPE]") [TEXT]</Code>
                    TextBlock(title="Parameters:")
                        | <Code>
                        | icon = [ICON] <Hint info="#{optional}"/><br>
                        | type = default | primary | secondary | disabled <Hint info="#{optional}"/><br>
                        | </Code>
                    TextBlock(title="Examples, default style:")
                        Button(type="default") Default
                        Button(type="default pulse") Default with pulse effect
                        Button(icon="picture",type="default") Default with icon
                    TextBlock(title="Examples, primary style:")
                        Button(type="primary") Primary
                        Button(type="primary pulse") Primary with pulse effect
                        Button(icon="picture",type="primary") Primary with icon
                    TextBlock(title="Examples, secondary style:")
                        Button(type="secondary") Secondary
                        Button(type="secondary pulse") Secondary with pulse effect
                        Button(icon="picture",type="secondary") Secondary with icon
                    TextBlock(title="Examples, disabled style:")
                        Button(type="disabled") Disabled
                        Button(type="disabled pulse") Disabled with pulse effect
                        Button(icon="picture",type="disabled") Disabled with icon
                Description(title="Buttons in a group panel")
                    div.--hatched
                        TextBlock(title="Examples:")
                            ButtonGroup
                                +each('Array(10) as _, i')
                                    Button(type="default") Default

            Title(size="2") Checkboxes
            Section
                Description(title="About checkboxes")
                    TextBlock(title="Syntax:")
                        | <Code>CheckBox(checked,disabled) [TEXT]</Code>
                    TextBlock(title="Parameters:")
                        | <Code>
                        | disabled <Hint info="#{optional}#{flag}"/><br>
                        | checked <Hint info="#{optional}#{flag}"/><br>
                        | </Code>
                    TextBlock(title="Examples:")
                        CheckBox Default unchecked
                        CheckBox(checked) Default checked
                        br
                        CheckBox(disabled) Disabled unchecked
                        CheckBox(disabled,checked) Disabled checked

            Title(size="2") Radio Buttons
            Section
                Description(title="About radio buttons")
                    TextBlock
                        | These are just checkboxes just with a slightly different style and behaviour.<br>
                        | <b style="color:red;">TODO Rename CheckBox to Toggle</b>
                    TextBlock(title="Syntax:")
                        | <Code>CheckBox(type="radio",name="[NAME]") [TEXT]</Code>
                    TextBlock(title="Parameters:")
                        | <Code>
                        | type = radio<br>
                        | name = [STRING] <Hint info="#{optional}"/><br>
                        | disabled <Hint info="#{optional}#{flag}"/><br>
                        | checked <Hint info="#{optional}#{flag}"/><br>
                        | </Code>
                    TextBlock(title="Examples:")
                        CheckBox(type="radio",name="foo1") Default unchecked
                        CheckBox(type="radio",name="foo1",checked) Default checked
                        br
                        CheckBox(type="radio",name="foo2",disabled) Disabled unchecked
                        CheckBox(type="radio",name="foo2",disabled,checked) Disabled checked

            Title(size="2") Input fields
            Section
                Description(title="About input fields")
                    TextBlock(title="Syntax:")
                        | <Code>Field(value="[VALUE]",placeholder="[TEXT]",type="[TYPE]",disabled) [TEXT]</Code>
                    TextBlock(title="Parameters:")
                        | <Code>
                        | type = text | password <Hint info="#{optional}"/><br>
                        | value = [STRING] <Hint info="#{optional}"/><br>
                        | placeholder = [STRING] <Hint info="#{optional}"/><br>
                        | disabled <Hint info="#{optional}#{flag}"/><br>
                        | </Code>
                    TextBlock(title="Examples standard:")
                        Field
                        Field(value="default value")
                        Field(placeholder="Placeholder")
                        Field(placeholder="Placeholder",value="default value")
                    TextBlock(title="Examples standard, disabled:")
                        Field(disabled)
                        Field(disabled,value="default value")
                        Field(disabled,placeholder="Placeholder")
                        Field(disabled,placeholder="Placeholder",value="default value")
                    TextBlock(title="Password type:")
                        Field(type="password")
                        Field(type="password",value="default value")
                        Field(type="password",placeholder="Placeholder")
                        Field(type="password",placeholder="Placeholder",value="default value")
                    TextBlock(title="Password type, disabled:")
                        Field(type="password",disabled)
                        Field(type="password",disabled,value="default value")
                        Field(type="password",disabled,placeholder="Placeholder")
                        Field(type="password",disabled,placeholder="Placeholder",value="default value")

            Title(size="2") Dialogs
            Section
                Description(title="About dialogs")
                    TextBlock
                        | You define just one <b>Dialog</b>-instance in your page, the rest will happen via the
                        | global JS-function <Code>'dialog.show'</Code> and data-attributes on the element
                        | triggering that function.
                    TextBlock(title="Trigger:")
                        | <Code>button(on:click='&#123;dialog.show&#125;',data-type="success",data-title="Title",data-text="Text")</Code>
                    TextBlock(title="Parameters:")
                        | <Code>
                        | data-type : success | error | info | confirm <Hint info="#{optional}"/><br>
                        | data-title: [STRING] <Hint info="#{optional}"/><br>
                        | data-text : [STRING] <Hint info="#{optional}"/><br>
                        | </Code>
                    TextBlock(title="Examples:")
                        button(on:click="{dialog.show}",data-title="Some title",data-text="Some text") Show Neutral Dialog
                        button(on:click="{dialog.show}",data-type="success",data-title="Success :)",data-text="Success Text") Show Success Dialog
                        button(on:click="{dialog.show}",data-type="error",data-title="Error :(",data-text="Success Text") Show Error Dialog
                        button(on:click="{dialog.show}",data-type="info",data-title="Info!",data-text="Info Text") Show Info Dialog
                        button(on:click="{dialog.show}",data-type="confirm",data-title="Confirm?",data-text="Confirm Text") Show Confirm Dialog

            Title(size="2") Notifications
            Section
                Description(title="About notifications")
                    TextBlock
                        | You define just <b>Notification</b>-instances in your page, the rest will happen via the
                        | global JS-function <Code>'notification.show'</Code> and data-attributes on the element
                        | triggering that function.
                    TextBlock
                        | Notifications can appear in two shaping: as <b>badge</b> (default) and as <b>floatable</b>
                        | box. Ideally you define just one instance of each so that you have a maximum of two in your
                        | doc (or just one, if you only need one type). Which notification is triggered is depending
                        | on the <Code>'data-floatable' </Code>-attribute later on.
                    TextBlock
                        | The Notification itself has an option to define its close-behaviour. You can
                        | either define that it should close by clicking a 'close'-icon or you
                        | can define a auto-close time value (like '1s', '250ms', '2.5s', etc.)
                    TextBlock(title="Options:")
                        | <Code>
                        | Notification(close='click')<br>
                        | Notification(close='[FLOAT|INT](ms|s)')<br>
                        | Notification(close='click',floatable)<br>
                        | Notification(close='[FLOAT|INT](ms|s)',floatable)
                        | </Code>
                    TextBlock(title="Trigger:")
                        | <Code>button(on:click='&#123;notification.show&#125;',data-type="success",data-title="Title",data-text="Text",data-floatable)</Code>
                    TextBlock(title="Parameters:")
                        | <Code>
                        | data-type     : success | error | info | confirm <Hint info="#{optional}"/><br>
                        | data-title    : [STRING] <Hint info="#{optional}"/><br>
                        | data-text     : [STRING] <Hint info="#{optional}"/><br>
                        | data-floatable <Hint info="#{optional}#{flag}"/><br>
                        | </Code>
                    TextBlock(title="Examples for badge notification:")
                        button(on:click="{notification.show}",data-type="success",data-title="Success :)",data-text="Success Text") Show Success Badge Notification
                        button(on:click="{notification.show}",data-type="error",data-title="Error :(",data-text="Error Text") Show Error Badge Notification
                        button(on:click="{notification.show}",data-type="info",data-title="Info!",data-text="Info Text") Show Info Badge Notification
                        button(on:click="{notification.show}",data-type="confirm",data-title="Confirm?",data-text="Confirm Text") Show Confirm Badge Notification
                    TextBlock(title="Examples for floatable notification:")
                        button(on:click="{notification.show}",data-floatable,data-type="success",data-title="Success floatable :)",data-text="Success Floatable Text") Show Success Floatable Notification
                        button(on:click="{notification.show}",data-floatable,data-type="error",data-title="Error floatable :(",data-text="Error Floatable Text") Show Error Floatable Notification
                        button(on:click="{notification.show}",data-floatable,data-type="info",data-title="Info floatable!",data-text="Info Floatable Text") Show Info Floatable Notification
                        button(on:click="{notification.show}",data-floatable,data-type="confirm",data-title="Confirm floatable?",data-text="Confirm Floatable Text") Show Confirm Floatable Notification


            Title(size="3") Grid
            Section
                Description(title="About grid")
                    TextBlock
                        | A grid based on <b>Tile</b>s which can recive a width/height (based on cells from this grid)
                        | and which keep their original defined aspect ratio even at resizing.
                    TextBlock(title="Examples:")
                        Grid
                            +each('images as image')
                                Tile(width="{image.width}",height="{image.height}",gap="{gridGap}")
                                    Image(url="{image.url}",focal="{image.focal}")
                                    Overlay
                                        Label {image.desc}
                                        a(href="foo",style="pointer-events:all;")
                                            Icon(icon="help")
                            Tile(width="6",height="3",clip="{false}",gap="{gridGap}")
                                FlipPanel
                                    .wrapper(slot="front",style="box-shadow:0 10px 20px rgba(0,0,0,.25)")
                                        Image(url="{images[0].url}",focal="{images[0].focal}")
                                        Overlay
                                            Label Click to flip
                                            a(href="foo",style="pointer-events:all;")
                                                Icon(icon="help")
                                    .wrapper(slot="back",style="padding:1em;box-shadow:0 10px 20px rgba(0,0,0,.25);background-color: #ddd;")
                                        Article(title="Image Title") {images[0].desc} (Click to flip back)
                            Tile(width="6",height="3",clip="{false}",gap="{gridGap}")
                                FlipPanel
                                    .wrapper(slot="front",style="box-shadow:0 10px 20px rgba(0,0,0,.25)")
                                        Image(url="{images[1].url}",focal="{images[1].focal}")
                                        Overlay
                                            Label Click to flip
                                            a(href="foo",style="pointer-events:all;")
                                                Icon(icon="help")
                                    .wrapper(slot="back",style="padding:1em;box-shadow:0 10px 20px rgba(0,0,0,.25);background-color: #ddd;")
                                        Article(title="Image Title") {images[1].desc} (Click to flip back)

            Title(size="2") Articles
            Section
                Description(title="About articles")
                    TextBlock
                        | A simple textblock cappable of showing a title and content, all with a specific style.
                    TextBlock(title="Options:")
                        | <Code>
                        | Article(title='My Article')
                        | </Code>
                    TextBlock(title="Parameters:")
                        | <Code>
                        | title: [STRING] <Hint info="#{optional}"/><br>
                        | </Code>
                    TextBlock(title="Examples:")
                        Article(title="First Article") Some article text.

            Title(size="2") Cards
            Section
                Description(title="About cards")
                    TextBlock
                        | They're based on <b>FlipPanel</b> with a specific style and already prepared, so all you need is
                        | to define the content for the front and back of the card. It uses '<a href="https://svelte.dev/tutorial/named-slots" target="_blank_">named slots</a>'.
                    TextBlock(title="Examples (click on card to flip/back):")
                        Card
                            .wrapper(slot="image")
                                Image(url="{images[0].url}",focal="{images[0].focal}")
                            span(slot="shortDesc") Short Description
                            span(slot="longDesc") Long Description
                        Card
                            .wrapper(slot="image")
                                Image(url="{images[1].url}",focal="{images[1].focal}")
                            span(slot="shortDesc") Short Description
                            span(slot="longDesc") Long Description
                        Card
                            .wrapper(slot="image")
                                Image(url="{images[2].url}",focal="{images[2].focal}")
                            span(slot="shortDesc") Short Description
                            span(slot="longDesc") Long Description

            Title(size="2") Accordion
            Section
                Accordion
                    AccordionEntry(title="Tab A") Content A
                    AccordionEntry(title="Tab B") Content B
                    AccordionEntry(title="Tab C") Content C
                    AccordionEntry(title="Tab D") Content D
                    AccordionEntry(title="Tab E") Content E
            Title(size="2") Wiper
            Section
                Description(title="About wiper")
                    TextBlock
                        | A wiper is a container holding up 'pages'. When scrolling, the pages will
                        | be 'wiped' to top, revealing the next page. When stopping scrolling - 
                        | and a page is not fully shown - the wiper will automatically slide in/out
                        | the best matching page in this situation.
                    TextBlock(title="Examples:")
                        div(style="position:relative;width:50vw;height:50vh;")
                            Wiper
                                WiperPage
                                    Image(url="{images[0].url}",focal="{images[0].focal}")
                                WiperPage
                                    Image(url="{images[1].url}",focal="{images[1].focal}")
                                WiperPage
                                    Image(url="{images[2].url}",focal="{images[2].focal}")

            Title(size="2") SideBar
            Section
                Description(title="About the sidebar")
                    TextBlock
                        | There should be just one instance of SideBar in the document.<br>
                        | When added you can toggle the SideBar by calling <Code>'sidebar.show'</Code>.<br>
                        | As container the SideBar can be filled with any kind of content.<br>
                        | It'll stay fixed when scrolling.
                    TextBlock(title="Trigger:")
                        | <Code>button(on:click='&#123;sidebar.show&#125;')</Code>

        PageBlock(hatched)
            Title(size="2") Slider
            Section TO BE DONE

            Title(size="2") Teaser
            Section TO BE DONE

            Title(size="2") Tabbed pane
            Section TO BE DONE

            Title(size="2") Code
            Section TO BE DONE

            Title(size="2") Description
            Section TO BE DONE

            Title(size="2") Flip panel
            Section TO BE DONE

            Title(size="2") Hint
            Section TO BE DONE

            Title(size="2") Icon
            Section TO BE DONE

            Title(size="2") Icon bar
            Section TO BE DONE

            Title(size="2") Image
            Section TO BE DONE

            Title(size="2") Label
            Section TO BE DONE

            Title(size="2") Notification
            Section TO BE DONE

            Title(size="2") Overlay
            Section TO BE DONE

            Title(size="2") Section
            Section TO BE DONE

            Title(size="2") Text block
            Section TO BE DONE

            Title(size="2") Tile
            Section TO BE DONE

            Title(size="2") Title
            Section TO BE DONE

            Title(size="2") Page
            Section TO BE DONE
</template>

<script>
    // TODO merge Title|Section, make new 'Section' collapsible?ö
    import EventBus from './lib/event-bus'; // Note: this should be imported before any component!
    import x        from './lib/x';

    window.eventBus = new EventBus; // Note: this should be created before any component!

    import Accordion      from './component/Accordion.svelte';
    import AccordionEntry from './component/AccordionEntry.svelte';
    import Article        from './component/Article.svelte';
    import Button         from './component/Button.svelte';
    import ButtonGroup    from './component/ButtonGroup.svelte';
    import Card           from './component/Card.svelte';
    import CheckBox       from './component/CheckBox.svelte';
    import Code           from './component/Code.svelte';
    import Description    from './component/Description.svelte';
    import Dialog         from './component/Dialog.svelte';
    import Field          from './component/Field.svelte';
    import FlipPanel      from './component/FlipPanel.svelte';
    import Grid           from './component/Grid.svelte';
    import Header         from './component/Header.svelte';
    import Hint           from './component/Hint.svelte';
    import Icon           from './component/Icon.svelte';
    import IconBar        from './component/IconBar.svelte';
    import Image          from './component/Image.svelte';
    import Label          from './component/Label.svelte';
    import NavBar         from './component/NavBar.svelte';
    import Notification   from './component/Notification.svelte';
    import Overlay        from './component/Overlay.svelte';
    import Page           from './component/Page.svelte';
    import PageBlock      from './component/PageBlock.svelte';
    import Section        from './component/Section.svelte';
    import SideBar        from './component/SideBar.svelte';
    import TextBlock      from './component/TextBlock.svelte';
    import Tile           from './component/Tile.svelte';
    import Title          from './component/Title.svelte';
    import Wiper          from './component/Wiper.svelte';
    import WiperPage      from './component/WiperPage.svelte';

    let debug   = true;
    let gridGap = '.5em';
    let images  = [
        { focal: {y: 30}, desc: 'Crystal', width: 4, height: 2, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddkr6rp-baa0678d-d1cd-4acd-9c57-1b52473984dc.jpg/v1/fill/w_1132,h_706,q_70,strp/crystal_by_xistenceimaginations_ddkr6rp-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9Nzk4IiwicGF0aCI6IlwvZlwvMzg5YTQwNjctNTY0YS00YjI0LWEzNzEtODc5OWRjNWQ2NjhlXC9kZGtyNnJwLWJhYTA2NzhkLWQxY2QtNGFjZC05YzU3LTFiNTI0NzM5ODRkYy5qcGciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.GaBz4wCgIRZxYFnSc3cNhrrTnDNDy2YYUvWcsB-lRzg' },
        { desc: 'Project 138', width: 1, height: 2, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddkdpw2-7d2c202b-e322-474b-a8b1-cfd8ace25184.jpg/v1/fill/w_1280,h_2021,q_75,strp/project_138_by_xistenceimaginations_ddkdpw2-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MjAyMSIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRrZHB3Mi03ZDJjMjAyYi1lMzIyLTQ3NGItYThiMS1jZmQ4YWNlMjUxODQuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.9OOsIOiBUvVKDZusMbV1YQB6X_qTWnkzVULBX6WFfc8' },
        { focal: {y: 230}, desc: 'Desc 3', width: 2, height: 2, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddk984l-7b153911-39c5-411d-9c55-d7ca0cf5a6e3.jpg/v1/fill/w_1280,h_2021,q_75,strp/quickpaint_12_11_2019_by_xistenceimaginations_ddk984l-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MjAyMSIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRrOTg0bC03YjE1MzkxMS0zOWM1LTQxMWQtOWM1NS1kN2NhMGNmNWE2ZTMuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.e0c7TbVXfIVD7xkQcZdPS6_AM8XGrPHgCx41r0VM_p4' },
        { desc: 'Desc 4', width: 3, height: 2, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddjx64v-63cc51e4-b236-445c-b0b6-ddd9b90f10a4.jpg/v1/fill/w_1280,h_655,q_75,strp/planet_harvester_by_xistenceimaginations_ddjx64v-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NjU1IiwicGF0aCI6IlwvZlwvMzg5YTQwNjctNTY0YS00YjI0LWEzNzEtODc5OWRjNWQ2NjhlXC9kZGp4NjR2LTYzY2M1MWU0LWIyMzYtNDQ1Yy1iMGI2LWRkZDliOTBmMTBhNC5qcGciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.Gs8ku-E3xWamViEndAbEFpeNgeMsTzvSPJa8VcHWXQU' },
        { focal: {x: 130}, desc: 'Desc 5', width: 2, height: 2, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddjuz4h-dcd61e2d-5f50-4187-8a57-a005a3a4af8f.jpg/v1/fill/w_1280,h_634,q_75,strp/spirit_by_xistenceimaginations_ddjuz4h-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NjM0IiwicGF0aCI6IlwvZlwvMzg5YTQwNjctNTY0YS00YjI0LWEzNzEtODc5OWRjNWQ2NjhlXC9kZGp1ejRoLWRjZDYxZTJkLTVmNTAtNDE4Ny04YTU3LWEwMDVhM2E0YWY4Zi5qcGciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.4EF7Ph6zazjloFyoyq-Vm7AqVuU8MwHH1_03YPJWXCc' },
        { desc: 'Desc 6', width: 2, height: 3, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddjiuma-bed99f1b-a69c-42c6-a31c-6aed420974fd.jpg/v1/fill/w_861,h_929,q_70,strp/peace_by_xistenceimaginations_ddjiuma-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTM4MSIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRqaXVtYS1iZWQ5OWYxYi1hNjljLTQyYzYtYTMxYy02YWVkNDIwOTc0ZmQuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.7l6SOdshQsOJ8JdHs88gYXGin_YPUDXHD0MhF62SpFI' },
        { desc: 'Desc 7', width: 2, height: 3, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddjdsey-5697fd03-2aab-47d1-afbe-f6d0f36338fe.jpg/v1/fill/w_1280,h_1920,q_75,strp/scourier_by_xistenceimaginations_ddjdsey-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTkyMCIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRqZHNleS01Njk3ZmQwMy0yYWFiLTQ3ZDEtYWZiZS1mNmQwZjM2MzM4ZmUuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.w2x9oAr9MDDHEao152zdYh6U60sfR6X5mpkPVsSS4JY' },
        { desc: 'Desc 8', width: 8, height: 3, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddj8zwv-40f9b550-4f99-4b62-9eac-f149b8bf3d99.jpg/v1/fill/w_932,h_858,q_70,strp/quickpaint_by_xistenceimaginations_ddj8zwv-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTE3OCIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRqOHp3di00MGY5YjU1MC00Zjk5LTRiNjItOWVhYy1mMTQ5YjhiZjNkOTkuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.uP9fXzUTLRVYCzgKG2Zrb8fGah2o1-5iEo841I9gxb0' }
    ];

    x.init();

    // TODO test for triggering a special mode by holding down CTRL and then clicking/selecting a 'component'
    function onClick (e) {
        if (e.ctrlKey) {
            alert('Special');
        }
    }

    /*function showDialog(e) {
        window.eventBus.dispatch('sv-dialog', {id: e.target.dataset.dialog});
    }*/
</script>

<style lang="scss" global>
    @import 'App';

    .wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    /* TODO put this into App.scss */
    :global(*) {
        box-sizing: border-box;
    }

    :global(body) {
        background-color: var(--bg-color);
        color: var(--text-color);
        margin: 0;
        padding: 0;
        font-family: var(--font-main);
        font-size: 16px;
        //font-size: calc(100vw / 64); /* TODO base = 1024px > 16px font-size; this can be used if everything should scale relative to browser width */

        // TEST
        overflow-x: hidden;
        transition: margin 250ms;
    }

    .AppIcon {
        a {
            pointer-events: none;
            color: var(--text-color-light);
            display: inline-block;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%,-50%);
            font-size: 4em;
        }

        &--active {
            a {
                color: var(--primary-color);
            }
        }
    }
</style>

<svelte:window on:click={onClick} />
