#!/usr/bin/env python3
import fileinput

# from https://stackoverflow.com/questions/6116978/how-to-replace-multiple-substrings-of-a-string
import re

arrowColor = "FF4800"
cableColor = "FF9000"
borderColor = arrowColor
outlineColor = cableColor

rep = {"ff0000": outlineColor, "ffff00": arrowColor, "00ff00": borderColor, "0000ff": cableColor} # define desired replacements here

# use these three lines to do the replacement
rep = dict((re.escape(k), v) for k, v in rep.items()) 
pattern = re.compile("|".join(rep.keys()))

for k in range(1, 6):
    filename = f"cable_{k}.svg"
    with fileinput.FileInput(filename, inplace=True) as file:
        for line in file:
            new_line = pattern.sub(lambda m: rep[re.escape(m.group(0))], line)
            print(new_line, end='')
