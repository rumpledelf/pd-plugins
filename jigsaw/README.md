# Jigsaw

Six or twelve interlocking pieces of an existing Animals photograph. Drag pieces close to their matching space to snap them in. Incorrect drops return to the tray. Another animal chooses a different photograph and resets the puzzle, including during an active move. The difficulty selector rebuilds the same photograph at the selected piece count. Completion removes seams after all pieces finish snapping into place.

Keyboard: Tab to a piece, Enter or Space picks it up, arrows choose a target space, Enter places it. Escape cancels. The current space has a local curved outline. Reduced motion places pieces without a slide.

This deliberately uses a larger playfield than 250px: a 270px square photo plus a tray. Under 540px width the tray stacks below the photograph, maintaining usable touch targets.

## Photographs

tiger.jpg is loaded from https://photographicdictionary.com/images/t/tiger.jpg (photo188, word188, Animals). Photo by S.Brickman, https://www.flickr.com/photos/s-brickman/33450410056/, licensed CC BY-SA3.0 https://creativecommons.org/licenses/by-sa/3.0/. Visible attribution is included. The interactive display clips the photograph into pieces; the source image is unmodified.

The animal link /t/tiger matches the local routes table. At implementation time the local web server returns404 for that route; this plugin does not modify host routing.

All photographs load directly from fully qualified production URLs of the form `https://photographicdictionary.com/images/<letter>/<animal>.jpg`, including in the local tester. No duplicate image files are bundled. All have license 1 (CC BY-SA 3.0) in the local database snapshot. The visible author credit and animal link change with the photograph. Cropping into puzzle pieces is a display adaptation; original assets are unchanged. Image loading requires network access.

| File | Source photo ID | Photographer | Original source |
| --- | --- | --- | --- |
| lion.jpg | 64 | William Warby | https://www.flickr.com/photos/wwarby/2404546005/ |
| giraffe.jpg | 98 | David Davies | https://www.flickr.com/photos/davies/5896333233/ |
| koala.jpg | 216 | Guido Konrad | https://www.flickr.com/photos/icke48/50310119573/ |
| panda.jpg | 310 | Popofatticus | https://www.flickr.com/photos/barretthall/2478623520/ |
| meerkat.jpg | 1174 | Ronnie Macdonald | https://www.flickr.com/photos/ronmacphotos/9687131881/ |
| horse.jpg | 173 | Andrew Grey | https://www.flickr.com/photos/97534175@N00/2728870718/ |
| cat.jpg | 320 | Susanne Nilsson | https://www.flickr.com/photos/infomastern/23895188918/ |
| dog.jpg | 141 | Donnie Ray Jones | https://www.flickr.com/photos/donnieray/8720881905/ |
| elephant.jpg | 99 | Alaa Abd El Fattah | http://www.flickr.com/photos/alaaosh/3456470039/ |
| zebra.jpg | 9 | Riaan Labuschagne | http://www.flickr.com/photos/muftirythm/5134546561/ |
| duck.jpg | 148 | Stripy T-Shirt | https://www.flickr.com/photos/dfw/27185740/ |
| owl.jpg | 424 | Brendan Lally | https://www.flickr.com/photos/pictiurfear/2815358116/ |
| penguin.jpg | 317 | Christian Zeiser | https://www.flickr.com/photos/moonshiner69/8741304536/ |
| rabbit.jpg | 333 | Shawn Nystrand | https://www.flickr.com/photos/the_webhamster/5024794832/ |
| fox.jpg | 422 | peupleloup | https://www.flickr.com/photos/peupleloup/905461590/ |
| frog.jpg | 233 | Vanessa Mock | https://www.flickr.com/photos/15447211@N06/1625728501/ |

The set is deliberately hardcoded to these 17 animals; there are no runtime database or Flickr queries. Each selected photo's license was checked individually against the local snapshot. Do not assume future additions share that license. The initial animal is random; Another animal never repeats the current animal. Animal links use each word's local dictionary route, checked against the local word records.

Test: http://localhost:8080/plugin-tester.html?plugin=jigsaw
