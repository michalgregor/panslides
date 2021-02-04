---
bibliography: modules/bibliography.bib
author:
- name: "Author's Name"
  affiliation: "Author's Affiliation"
  email: 'author.name@domain.do'
title: '<span class="en">Title in English</span>
        <span class="sk">Nadpis v slovenčine</span>'
subtitle: '<span class="en">Subtitle in English</span>
           <span class="sk">Podnadpis v slovenčine</span>'
date: 24. 3. 2020
intro-left: '<p style="margin-top: 50px;">
             <img src="modules/feit_logo.svg" class="inline-img" style="height:100px" />
             <span class="en"><img src="modules/luiza_logo_full.svg" class="inline-img" style="height:85px" /></span>
             <span class="sk"><img src="modules/luiza_logo_full.svg" class="inline-img" style="height:85px" /></span>
             </p>'
slideNumber: c/t
customtheme: reveal/uniza_theme/uniza.css"
intro-right: "<img src=\"modules/intro.png\" style=\"height: 500px;\">"
langs: "en:English,sk:Slovenčina"
---

# [Introduction]{.en} [Úvod]{.sk} {.empty}

***

## {{heading1}}

* [Bullet point.]{.en}
  [Odrážka.]{.sk}

[@goodfellowetal2016]

## [Self-contained HTML Files]{.en} [Samostatné HTML súbory]{.sk}

* [Reveal.js presentations can be rendered as stand-alone HTML files.]{.en}

  * [Images and other resources are base64 encoded and embedded into the HTML itself.]{.en}
    []{.sk}

* [Unfortunately, some javascript plugins are ]{.en}
  []{.sk}

## [Videos]{.en} [Videá]{.sk}

:::::{.columns}
:::::{.column width="50%"}
![
  [A video with a caption.]{.en}
  [Video s popiskom.]{.sk}
](video/td_backups.mp4){width="100%" data-autoplay=true muted=true}
:::::
:::::{.column width="50%"}

* [For all but the smallest videos, consider using the ``external="1"`` attribute. This means they will not be base64 embedded when generating self-contained HTML files.]{.en}
  [Pre všetky videá okrem tých úplne najmenších zvážte použitie atribútu ``external="1"``. Znamená to, že sa nebudú embedovať v base64 forme pri generovaní samostatných HTML súborov.]{.sk}

![
  [A video with a caption and ``external="1"``.]{.en}
  [Video s popiskom a ``external="1"``.]{.sk}
](video/td_backups.mp4){width="100%" data-autoplay=true muted=true external="1"}

:::::
:::::

## [Overlays]{.en} [Animácie]{.sk}

* [Displays at step 1.]{.en}
  [Zobrazí sa v kroku 1.]{.sk}

* [Displays at step 2.]{.en}
  [Zobrazí sa v kroku 2.]{.sk}
  {onslide="2-"}

* [Displays only at step 3.]{.en}
  [Zobrazí sa len v kroku 3.]{.sk}
  {only="3"}

* [Displays at steps 3-4.]{.en}
  [Zobrazí sa v krokoch 3-4.]{.sk}
  {only="3-4"}

``` {.include}
modules/thankspage.md
```

## [References]{.en} [Zdroje]{.sk}

<div id="refs"></div>
