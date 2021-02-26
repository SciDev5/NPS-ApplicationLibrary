import os
import json
import time

FILE_NAME = "./timetracker.json"

lastFileContents = []
if os.path.isfile(FILE_NAME):
	with open(FILE_NAME) as ttf:
		lastFileContents = json.loads(ttf.read())

isstart = None
now = str(time.time())
if len(lastFileContents) == 0:
	lastFileContents.append({"start":now,"end":None})
	isstart = True
elif lastFileContents[-1]["end"] == None:
	lastFileContents[-1]["end"] = now;
	isstart = False
else:
	lastFileContents.append({"start":now,"end":None})
	isstart = True

with open(FILE_NAME,"w") as ttf:
	ttf.write(json.dumps(lastFileContents))

input("isstart: "+str(isstart))