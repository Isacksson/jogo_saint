# Plano de Reprocessamento — A Lenda Áurea
### do protótipo v0.1 → v1.0 sobre o GDD v0.2

> **Princípio.** Isto **não é** uma reescrita do zero. O motor, o combate, o loot,
> os saves, o áudio e o Ato I + as 6 fossas da v0.1 foram testados e ficam. Nós
> *reprocessamos por módulos* — elevando qualidade, corrigindo bugs e padronizando —
> e só então construímos a expansão da v0.2 por cima de uma base sólida.

## Como usar este documento (uma sessão de cada vez)

Como temos poucos tokens por sessão e muito trabalho, cada item abaixo é um passo
**pequeno, autocontido, testável e commitável**. Em cada sessão:

1. Abra este arquivo e pegue o **próximo item `[ ]`** do bloco ativo.
2. Faça **só aquele item** (não adiante os próximos).
3. **Teste** no navegador (Chromium headless via Playwright, como já fazemos).
4. **Commit + push** na branch de trabalho.
5. Marque o item como `[x]` aqui, no mesmo commit.

A ordem dos blocos importa: **Bloco A (fundação) vem antes do conteúdo novo**, porque
os padrões criados nele (portais, mapas, diálogo) são reaproveitados por todo o resto.

---

## BLOCO A — Fundação & Qualidade
*Reprocessa o que já existe e cria os padrões que a v0.2 vai reutilizar. Sessões curtas.*

- [x] **A1 — Portais visíveis e reversíveis** *(corrige o bug relatado)* ✔ feito
  Marcador universal para TODO portal (`renderPortals` em `main.js`), desenhado
  depois da escuridão para brilhar através dela: limiar dourado pulsante + setas
  deslizando no sentido da saída (direção inferida pelo formato do portal) +
  rótulo com o nome do destino (`◄ Catacumbas dos Mártires`, `▼ Pântano...`).
  Testado nas catacumbas, na Fossa da Ira e em Silena — voltar já é visível e
  funcional nos dois sentidos.
  - *Observação para A2*: os portais de volta das fossas são alvos pequenos (1×2
    no canto). O marcador resolve a visibilidade; ao refatorar mapas, vale
    aumentar a zona de gatilho desses portais para facilitar o acerto.

- [x] **A2a — Zonas de gatilho dos portais de volta** ✔ feito
  Os portais de volta das fossas eram alvos de 1×2 no canto. Alargados para a
  coluna inteira da sala de entrada (`h: 2 → 5`), então andar para a esquerda de
  qualquer altura da sala já sai. Sem gatilho instantâneo no spawn (que é em x=4).
  Testado em ira/gula/preguiça saindo do meio da sala.

- [ ] **A2b — Extração `makeFossa()`** *(adiado de propósito)*
  As 6 fossas ainda são copy-paste. O único ganho da extração é conveniência
  **futura** (novos pontos de entrada no Bloco C). Como mapa quebrado é pior que
  código repetido e temos orçamento apertado, **adiamos até o Bloco C precisar** —
  aí a refatoração é feita junto com o primeiro capítulo que reusa uma fossa.

- [x] **BUG — Chefes ressuscitando** ✔ corrigido *(fora do plano original)*
  Ao salvar/recarregar (e no renascer), os chefes reapareciam porque o mapa era
  reconstruído de `spawns`. Agora, ao morrer, chefe/mini-chefe grava
  `flags.defeated[mapId]` e (se abre selo) `flags.sealsBroken[mapId]`; ambos
  persistem no save. Na reconstrução do mapa, chefe já derrotado não renasce e a
  alcova rompida continua aberta. Testado: Amon morto continua morto após reload.

- [ ] **A3 — Caixa de diálogo rica**
  A história da v0.2 é muito mais densa. A caixa atual é texto simples.
  - Retrato do NPC (recorte do sprite) ao lado do nome.
  - Avanço por página com indicador claro; suporte a falas longas condicionais.
  - Base para o **pregoeiro/editos de Diocleciano** (o "relógio narrativo" da v0.2).

- [ ] **A4 — Navegação e orientação**
  - Indicador na borda da tela apontando para a saída/objetivo quando fora de quadro.
  - Opcional: bússola simples de objetivo atual no HUD.

- [ ] **A5 — Polish de transição**
  - Fade curto ao trocar de mapa (hoje o corte é seco).
  - Refino de feedback sonoro nas transições e portais.

---

## BLOCO B — Infraestrutura da v0.2
*Sistemas novos exigidos antes de qualquer região nova. Detalhe em `docs/GDD.md` §6.*

- [ ] **B1 — Sistema de lança** *(GDD T12)* — a lança de guarnição com 3 estágios
      visuais e de dano; substitui o dano fixo atual do ataque pesado. Ascalon
      deixa de ser "já dada" e passa a ser forjada.
- [ ] **B2 — Economia** *(GDD T13)* — ferreiro **Rufo** e mercadora **Prisca**, loja
      simples (comprar/vender), e os **fragmentos de Ascalon** como item de inventário.
- [ ] **B3 — Estradas do Império** *(GDD T14)* — tela de viagem ligando Silena aos
      hubs novos, com desbloqueio progressivo de destinos.
- [ ] **B4 — Anjo da Guarda** *(GDD T14b)* — companheiro de IA com 7 patentes, dado
      no Prólogo, que evolui a cada bênção (GDD §3.6).

---

## BLOCO C — Conteúdo da v0.2
*Cada capítulo = região de superfície + a fossa já existente + instrumento. ~2 sessões
cada. Segue o roadmap do GDD §6 (T15–T26); as fossas são reaproveitadas, não refeitas.*

- [ ] **C1 — Forte Sebaste** (superfície de São Sebastião) + reentrada na Fossa da Ira
      + Corda de Sebastião + emboscada do Cavaleiro Guerra. *(GDD T15–T16)*
- [ ] **C2 — Porto de Luzia** + Fossa da Inveja + Espelho de Luzia + Cavaleiro Conquista. *(T17–T18)*
- [ ] **C3 — Ermo de Antão** + Fossa da Gula + Cajado de Antão. *(T19–T20)*
- [ ] **C4 — Distrito do Tesouro** (revisita) + Fossa da Avareza + Balança de Lourenço
      + Cavaleiro Fome. *(T21–T22)*
- [ ] **C5 — Vila do Jardim de Inês** + Fossa da Luxúria + Grinalda de Inês. *(T23–T24)*
- [ ] **C6 — Mosteiro de Núrsia** + Fossa da Preguiça + Sino de Bento + Cavaleiro Morte
      + **cena da forja de Ascalon** (fecho do Ato II). *(T25–T26)*

---

## BLOCO D — Ato III e Fecho
- [ ] **D1 — Portas do Abismo** — mapa final + Quatro Cavaleiros como arauto +
      Serpente Antiga fases 1–2. *(GDD T27)*
- [ ] **D2 — Nicomédia e a Tentação** — eco final de Diocleciano, fase 3 da Serpente,
      epílogo das rosas, créditos. *(GDD T28)*
- [ ] **D3 — Balanceamento e polish final** — curva de dano/vida/preços, tela de vitória. *(GDD T29)*

---

## Já pronto na v0.1 (mantido e reaproveitado)

Motor (game loop, input, câmera, colisão) · combate em tempo real (combo, lança,
esquiva, Fúria) · loot com raridades, inventário, XP/níveis, altares/save ·
Ato I completo (Capadócia → Silena → Pântano → Catacumbas, quest da chave, Dragão) ·
as **6 fossas** com príncipes e os **7 milagres** dos santos · áudio Web Audio ·
tela de título · arte do Ninja Adventure Pack (CC0).

Estes sistemas são a fundação; o reprocessamento os pole e a v0.2 os expande.
