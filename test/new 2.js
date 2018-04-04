/* feedreader.js
 *
 * This is the spec file that Jasmine will read and contains
 * all of the tests that will be run against your application.
 */

/* We're placing all of our tests within the $() function,
 * since some of these tests may require DOM elements. We want
 * to ensure they don't run until the DOM is ready.
 */
$(function () {

    /* Define some variables that will be used through the tests */
    var allFeedsLength = allFeeds.length,
        $body = $('body'),
        entries_before,
        entries_after;

    /* First test suite, about the RSS feeds definitions,
    * and the allFeeds variable in our application.
    */
    describe('RSS Feeds', function () {

        /* 'are defined' tests to make sure that the allFeeds
         * variable has been defined and that it is not empty.
         */
        it('are defined', function () {
            expect(allFeeds).toBeDefined();
            expect(allFeedsLength).not.toBe(0);
        });

        /* 'have URL' tests to loop through each feed
         * in the allFeeds object and ensure it has a URL
         * defined and that the URL is not empty.
         */
        it('have URL and is not empty', function () {
            for (var i = 0; i < allFeedsLength; i++) {
                expect(allFeeds[i].url).toBeDefined();
                expect(allFeeds[i].url.length).not.toBe(0);
            }
        });

        /* 'have name' tests to loop through each feed
         * in the allFeeds object and ensure it has a name
         * defined and that the name is not empty.
         */
        it('have name and is not empty', function () {
            for (var i = 0; i < allFeedsLength; i++) {
                expect(allFeeds[i].name).toBeDefined();
                expect(allFeeds[i].name.length).not.toBe(0);
            }
        });
    });

    /* Second test suite, about the sidebar menu */
    describe('The menu', function () {

        /* 'is hidden by default' ensures the menu element is hidden
         * by default, looking if the body tag has the class 'menu-hidden'.
         */
        it('is hidden by default', function () {
            expect($body.hasClass('menu-hidden')).toEqual(true);
        });

        /* 'changes visibility' ensures that the menu changes visibility
         * when the menu icon is clicked: the menu is displayed when
         * clicked the first time, and is hidden when clicked again.
         */
        it('changes visibility when menu icon is clicked', function () {
            $('.menu-icon-link').trigger('click');
            //expect($body.hasClass('menu-hidden')).toBe(false);
            expect($body.hasClass('menu-hidden')).toBeFalsy();

            $('.menu-icon-link').trigger('click');
            expect($body.hasClass('menu-hidden')).toBeTruthy();
        });
    });

    /* Third test suite, about the initial entries */
    describe('Initial Entries', function () {

        /* First we call a function to do an async request.
         * This way we ensure that data is loaded before we can test the results.
         */
        beforeEach(function (done) {
            loadFeed(0, function () {
                done();
            });
        });

        /* When we have alreaded loaded the function, we test to ensure that
         * the loadFeed function has at least a single .entry elemente within
         * the .feed container, ones completed its work.
         */
        it('has an .entry element after loading', function (done) {
            var entry = $('.feed .entry')[0];
            expect(entry).toBeGreaterThan('');
            done();
        });
    });

    /* Fourth test suite, about the new feeds loaded */
    describe('New Feed Selection', function () {

        /* This test ensures that when a new feed is loaded
         * by the loadFeed function, the content actually changes.
         */
        beforeEach(function (done) {
            $('.feed').empty();

            /* First we call the feed and save the titles in the 'entries_before' variable,
             * which we will use to compare later with the second loaded feed.
             * We use 'beforeEach' to load this one before starting any comparison.
             * We put done() because it's asyncrhonous, without it the entries_before
             * assignment wouldn't wait to loadFeed to finish.
             */
            loadFeed(0, function () {
                entries_before = $('.feed').find("h2").text();
                console.log("entries before: " + entries_before);
                done();
            });
        });

        it('changes the content when new feed is loaded', function (done) {
            /* Here we load the feed again. This time we save the titles in the
             * 'entries_after' variable, and then we will compare them with 'entries_before'.
             * Since this is the same feed, it is asyncrhonous and we need to use done(),
             * to ensure that the feed has loaded enterily before comparing variables.
             */
            loadFeed(1, function () {
                entries_after = $('.feed').find("h2").text();
                console.log("entries after: " + entries_after);
                expect(entries_before).not.toEqual(entries_after);
                done();
            });
        });
    });
} ());