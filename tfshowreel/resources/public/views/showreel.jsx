
var Showreel = React.createClass({
    getInitialState: function() {
        return {
            projectList: {projects:[]}
        };
    },
    loadProjectsFromServer: function() {
        var comp = this;
        $.ajax({
            url: "/showreel-posts/showreel/list.json",
            dataType: 'json',
            success: function(data) {
                comp.setState({projectList: data});
            },
            error: function(xhr, status, err) {
                console.log('error');
            }
        });
    },
    componentDidMount: function() {
        this.loadProjectsFromServer();
    },
    render: function(){
        var comp = this;
        var urls = [];

        $("#showreel").carousel('cycle');

        for(i = 0; i < this.state.projectList.projects.length; i++){
            var show = this.state.projectList.projects[i].show;
            //check that the project is flagged to be included in the showreel
            if(show) {
                urls.push(this.state.projectList.projects[i].url);
            }
        }

        return(
                <div id="showreel" className="carousel slide" data-ride="carousel" data-pause="false">
                    <div className="carousel-inner">
                        <ShowreelData imageUrl="/showreel-image/showreelMedia" projectUrls={urls}/>
                    </div>
                </div>

        );
    }
});

var ShowreelData = React.createClass({
    getInitialState: function() {
        return {
            projects: []
        };
    },
    componentWillReceiveProps: function(nextProps) {
        var comp = this;
        var projects = [];
        //console.log(nextProps);

        nextProps.projectUrls.map(function(elem){
            $.ajax({
                url: elem + '.json',
                dataType: 'json',
                success: function(data) {
                    projects.push(data);
                    comp.setState({projects: projects});
                },
                error: function(xhr, status, err) {
                    console.log('error');
                }
            });
        });
    },
    generateFrames: function() {
        var comp = this;
        var frameData = [];

        this.state.projects.map(function(elem, index){
            var first = index == 0 ? true : false;
            var logo = elem.logo ?
                <img src={comp.props.imageUrl + "/" + elem.logo} alt="Logo"/>
                : <span className="logo-text">{elem.name}</span>;
            var frames = elem.frames;
            var background = elem.background;

                var frame = frames.map(function(subElem, index){
                    var itemClass = "item " + background;
                    if(index == 0 && first){
                        itemClass = "item active " + background;
                    }

                    var img = subElem.media ? <img src={comp.props.imageUrl + "/" + subElem.media} alt="media" /> : false;

                    if(subElem.fullscreen){
                        return(
                            <div className={itemClass}>
                                <div className="showreel-media-fullscreen">
                                    {img}
                                </div>
                                <div className="showreel-floating-logo">
                                    {logo}
                                </div>
                            </div>
                        );

                    } else {
                        if(!img){
                            return (
                                <div className={itemClass}>
                                    <div className="showreel-logo">
                                        {logo}
                                    </div>
                                    <br />
                                    <div className="showreel-large-blurb">
                                        <span>{subElem.blurb}</span>
                                    </div>
                                </div>
                            );
                        }else {
                            return (
                                <div className={itemClass}>
                                    <div className="showreel-blurb right">
                                        <span>{subElem.blurb}</span>
                                    </div>
                                    <div className="showreel-logo">
                                        {logo}
                                    </div>
                                    <div className="showreel-media">
                                        {img}
                                    </div>
                                </div>
                            );
                        }
                    }
                });
            frameData.push(frame);
        });

        return(<div className="frame-container">
            {frameData}
            </div>
        );
    },
    render: function() {
        var carousel = this.generateFrames();
        return(carousel);
    }
});

React.render(<Showreel/>, document.getElementById("content"));
