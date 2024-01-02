# SAP Community Activity Badges

[![REUSE status](https://api.reuse.software/badge/github.com/SAP-samples/sap-community-activity-badges)](https://api.reuse.software/info/github.com/SAP-samples/sap-community-activity-badges)

## Description

This service creates cards as images (svg or png) to display your SAP Community activity and achievements. Now you can share you SAP Community pride in other locations, such as you GitHub README. It also contains the service for the [Devtoberfest 2021 Gameboard](https://github.com/SAP-samples/devtoberfest-2021#contest-the-game)

For more details on your SAP Community Profile in general, we'd suggest you access this tutorial: [Update and Maintain Your SAP Profile at people.sap.com](https://developers.sap.com/tutorials/community-profile.html).

This service only works with data which you've choosen to expose from your public SAP Community Profile. Please refer to the [SAP Community Privacy statement](https://www.sap.com/about/legal/privacy.html) for more details

### Showcase Badges

Simply add you SCN Profile ID to the end of the `/showcaseBadges` path and the 5 top badges you have selected to be part of your public profile will appear in this card.

Example: **/showcaseBadges/your.SCN.ID**

![Example Showcase Badges Card](/srv/images/demo1.png)

You can also add the URL parameter `png=true` if you want to recieve a png image file instead of the default svg

Example: **/showcaseBadges/your.SCN.ID?png=true**

### Activity Badges

Simply add you SCN Profile ID to the end of the `/activity` path and the number of blog posts, comments, answers, and questions will appear in this card.

Example: **/activity/your.SCN.ID**

![Example Activity Card](/srv/images/demo2.png)

You can also add the URL parameter `png=true` if you want to receive a png image file instead of the default svg

Example: **/activity/your.SCN.ID?png=true**

### Devtoberfest Gameboard

Unlike the other parts of this sample, the Devtoberfest Gameboard is not direct image generator that can be used as a badge.  It is a full website that uses similar SVG rendering and SAP Community Profile APIs.  

We wanted the contest for this year's Devtoberfest to be accessible to a much greater number of community members.  Therefore this year’s Devtoberfest contest will include many different and smaller types of activities.

It will be a points based contest.  Points are awarded for things like attending one of the educational sessions, completing certain developer tutorials tied to the topic weeks, or other activities that contribute to the SAP Developer Community. Prizes are awarded based upon SAP Community badges which you earn and your must have a public Community profile to participate.

For the listing of activities, points and other contest details, please see [the Devtoberfest Group in the SAP Community](https://groups.community.sap.com/t5/devtoberfest/gh-p/Devtoberfest)

But the fun doesn’t end there.  We have this animated Contest Gameboard to help you track your progress through the contest.  Just add your SAP Community Profile ID to the end of the following URL: **/devtoberfestContest/scnId.Here**.

![Example Devtoberfest Gameboard](/srv/images/devtoberfest/devtoberfest_gameboard_promo1.png)

## Requirements

This project runs as an [MTAR](https://sap.github.io/cloud-mta-build-tool/) that deploys a single Node.js service to Cloud Foundry. The Node.js service runs without authentication and uses [Express](https://expressjs.com/) for its main HTTP framework.

## Download and Installation

We have a hosted version of this service at [https://devrel-tools-prod-scn-badges-srv.cfapps.eu10.hana.ondemand.com/](https://devrel-tools-prod-scn-badges-srv.cfapps.eu10.hana.ondemand.com/). However the project is also setup so that you can host your own version (or forked version). An mta.yaml for the project is included and you can build the MTAR and deploy to SAP BTP, Cloud Foundry environment. Or you can use the pre-built MTAR in the [Releases repository here in GitHub](https://github.com/SAP-samples/sap-community-activity-badges/releases)

## How to obtain support

[Create an issue](https://github.com/SAP-samples/<repository-name>/issues) in this repository if you find a bug or have questions about the content.

For additional support, [ask a question in SAP Community](https://answers.sap.com/questions/ask.html).

## License

Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSES/Apache-2.0.txt) file.
