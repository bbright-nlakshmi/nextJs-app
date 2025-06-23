import { API } from "@/app/globalProvider";
import React, { Fragment, useEffect, useState } from "react";

type AnnouncementProps = { announce: string };

const Announcement: React.FC = () => {
    const [announcement, setAnnounecement] = useState<string>()
    useEffect(() => {
        async function fetchAnnouncement() {
            const response = await API.getStoreAnnounce();
            //const result = await response.json();
            setAnnounecement(response.announce);
        }
        fetchAnnouncement();
    }, []);
    if (announcement)
        return (
            <Fragment>
                {/* <section className="announcement-panel">
                    <div className="announcement-panel-box">
                        <div className="announcement-bar">
                            <div className="static-text">
                                <div className="dot"></div>
                                New Announcement
                            </div>
                            <div className="scrolling-text-container">
                                <div className="scrolling-text">

                                </div>
                                <div className="scrolling-text">

                                </div>
                                <div className="scrolling-text">
                                    {announcement}
                                </div>
                                <div className="scrolling-text">

                                </div>
                                <div className="scrolling-text">

                                </div>

                            </div>
                        </div>
                    </div>
                </section> */}
                <div className="sqs-announcement-bar-dropzone">
                    <div className="sqs-announcement-bar-custom-location">
                        <div className="yui3-widget sqs-widget sqs-announcement-bar sqs-announcement-bar-focused">
                            <div id="yui_3_17_2_1_1750242397327_241" className="sqs-announcement-bar-content">
                                {/* <a className="sqs-announcement-bar-url"  ></a> */}
                                <div className="static-text">
                                    <div className="dot"></div>
                                    New Announcement
                                </div>
                                <div className="sqs-announcement-bar-text">
                                    {/* <span className="sqs-announcement-bar-close" role="button" aria-label="Close Announcement"></span> */}
                                    <div id="announcement-bar-text-inner-id" className="sqs-announcement-bar-text-inner">
                                        <p className="text-white" >{announcement}</p>
                                    </div>
                                </div></div></div></div></div>

            </Fragment>
        );
};
export default Announcement;
