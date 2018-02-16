  ___________________________________
|AZ23:- Developer notes: Tetris v1.31|
 ------------------------------------
Changes:

Now has "animation" on line clear.

Some sound effects re-captured: specifically the ones which had the block landing sound prepended.

Added the sound effect for the rows settling after a line clear.

Known Issues:  As before but now the game over sound plays correctly.

 
 ___________________________________
|AZ23:- Developer notes: Tetris v1.3|
 -----------------------------------
Changes:

Fixed straight block using wrong tiles when failing to rotate(something in the way)

Space bar now pauses the game and music. (Will add css for start button on GB)
GEBAS (Audio System) now has support for pause/resume. 

When stopping/pausing music, the output is muted to avoid already scheduled notes playing/continuing. This could be improved, however a reference to every playing note would need to be stored. Any notes that were played "muted" will not be replayed on resume.

Known Issues:

May not load correctly, refreshing the page seems to fix. 

Has only been tested in Chrome/firefox (Win/Android)

Will not run locally in Chrome due to xhttp origin restrictions (hates file://).

The start of the game over sound effect is missing.
 ___________________________________
|AZ23:- Developer notes: Tetris v1.2|
 -----------------------------------


Recent changes:

Tile based graphics - Stolen from the Gameboy game and recoloured for authenticity. 

CSS hit areas placed over buttons in Gameboy Image (from wikipedia). Now playable on mobile (YMMV of course)

Added sound - now uses MidiDecoder and GEBAS for audio output, SFX recorded from GB emulator, Midi of Korobeiniki(sp?) of unknown origin.

Basic intro screen - Will take place of title screen for now

Fixed drawing of straight block - Now each block of each brick has its tile stored seperately when the straight block is rotated, these are changed so that the outlines are drawn correctly.


Known Issues:

Has only been tested in Chrome (Win/Android)

May not load properly, refreshing the page seems to fix.

Straight block doesn't rotate properly.

Music continues to play over the game over sound effect.




