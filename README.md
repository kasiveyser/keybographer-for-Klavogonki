# Keybographer for Klavogonki
A userscript to record, analyze and visualize a keybogram (keypress sequence) in a typing competition site klavogonki.ru

# Recording

A *keybogam* is a sequence of keyboard events with timing, recorded since the start of the race. `performance.now()` is used for timing. The most important keyboard event to be recorded is  `onkeydown`. The `onkeyup` is also needed, but much less important (mostly for additional parameters calculation). For each printable keypress (i.e. the keypress that leads to input change), the simulataneous `Shift`, `Alt` and `Ctrl` status must also be watched. In addition to keyboard events, with each event the inputfield state must be recorded to show how the keyboard event affects it. It is also a good idea to record focus loss events `blur` to make sure we know when the typing is impossible because of some distraction.

# Analysis

The keybogram is analyzed for many parameters.

## Speed

There will be different types of speed measured.

*Resulting speed* or (*net speed*, or *real speed*) equals total actually accepted characters divided by total time spent for the race.

*Clean speed* (also called *gross\* speed* or *brutto\* speed*) equals total actually accepted characters divided by total time spent for typing exactly those characters, i. e. excluding the time spent for making typos and correcting those typos.

*Raw speed* (also called *gross+* or *brutto+*) is the total actually accepted characters plus characters that were deleted plus deletion pseudocharacters (`Backspace` or `Ctrl+Backspace`) divided by total time spent for the race.

*Momentary speed* is the reciprocal value of the pause between characters or strokes (i. e. momentary speed for 100 ms pause = 60 seconds/100 ms = 600 per minute).

Speed can be calculated as *cpm* (characters per minute) or *spm* (strokes per minute - where stroke is a keypress; for example, one character may require two or more keypresses, i. e. `Shift` + key, or a single keypress may yield multiple characters in case of autorpelacement usage).

## Corrections

For corrections, the following parameters are important:

*Series of corrections* is the total number of continuous usage of a backspace (or backspace with a `Ctrl` modifier, or a similar corrective method) events.

*Corrected characters* is the total characters deleted during corrections.

*Typo loss* is the percentage of time spent for making typos and then corecting them from the total time spent on the race.

*Correction coefficient for series/characters* is the the typo loss divided by series of corrections or corrected characters.

## Arrhythmia

`Arrhythmia` is the measurement of speed vairability throught the race.

## Retention

`Retention` is the time between `onkeydown` and `onkeyup` events for a certain keypress.

# Visualization