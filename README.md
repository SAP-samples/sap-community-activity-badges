# SAP Community Activity Badges

[![REUSE status](https://api.reuse.software/badge/github.com/SAP-samples/sap-community-activity-badges)](https://api.reuse.software/info/github.com/SAP-samples/sap-community-activity-badges)
[![Visits Badge](https://badges.pufler.dev/visits/SAP-samples/sap-community-activity-badges)](https://badges.pufler.dev)
[![Updated Badge](https://badges.pufler.dev/updated/SAP-samples/sap-community-activity-badges)](https://badges.pufler.dev)
[![Open in Visual Studio Code](https://open.vscode.dev/badges/open-in-vscode.svg)](https://open.vscode.dev/SAP-samples/sap-community-activity-badges)

## Description

This service creates cards as images (svg or png) to display your SAP Community activity and achievements. Now you can share you SAP Community pride in other locations, such as you GitHub README.

For more details on your SAP Community Profile in general, we'd suggest you access this tutorial: [Update and Maintain Your SAP Profile at people.sap.com](https://developers.sap.com/tutorials/community-profile.html).

This service only works with data which you've choosen to expose from your public SAP Community Profile. Please refer to the [SAP Community Privacy statement](https://www.sap.com/about/legal/privacy.html) for more details

### Showcase Badges

Simply add you SCN Profile ID to the end of the `/showcaseBadges` path and the 5 top badges you have selected to be part of your public profile will appear in this card.

Example: [/showcaseBadges/your.SCN.ID](/showcaseBadges/your.SCN.ID)

![Example Showcase Badges Card](/srv/images/demo1.png)

You can also add the URL parameter `png=true` if you want to recieve a png image file instead of the default svg

Example: [/showcaseBadges/your.SCN.ID?png=true](/showcaseBadges/your.SCN.ID?png=true)

### Activity Badges

Simply add you SCN Profile ID to the end of the `/activity` path and the number of blog posts, comments, answers, and questions will appear in this card.

Example: [/activity/your.SCN.ID](/activity/your.SCN.ID)

![Example Activity Card](/srv/images/demo2.png)

You can also add the URL parameter `png=true` if you want to recieve a png image file instead of the default svg

Example: [/activity/your.SCN.ID?png=true](/activity/your.SCN.ID?png=true)

## Requirements

## Download and Installation

## Known Issues

## How to obtain support

[Create an issue](https://github.com/SAP-samples/<repository-name>/issues) in this repository if you find a bug or have questions about the content.
 
For additional support, [ask a question in SAP Community](https://answers.sap.com/questions/ask.html).

## Contributing

## License
Copyright (c) 2021 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSES/Apache-2.0.txt) file.
