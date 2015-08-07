
var PreviewPage = React.createClass({
    getInitialState: function() {
        return {
            projectData:{
                id: undefined,
                name: undefined,
                logo: undefined,
                background: undefined,
                frames: []
            }
        };
    },
    loadProjectFromServer: function() {
        var comp = this;
        $.ajax({
            url: this.props.url + "/" + this.props.valueData,
            dataType: 'json',
            success: function(data) {
                comp.setState({projectData: data});
            },
            error: function(xhr, status, err) {
                console.log('error');
            }
        });
    },
    generateFrames: function() {
        var comp = this;
        var logo = this.state.projectData.logo ?
            <img src={comp.props.imageUrl + "/" + this.state.projectData.logo} alt="Logo"/>
            : <span className="logo-text">{this.state.projectData.name}</span>;
        var frames = this.state.projectData.frames;
        var carouselClass = 'carousel-inner ' + this.state.projectData.background;

        var indicators = frames.map(function(elem, index){
            var active;
            if(index == 0){
                active = "active";
            }
            return(<li data-target="#showreel-preview" data-slide-to={index} className={active}></li>);
        });

        var frameData = frames.map(function(elem, index){
            var itemClass = "item";
            if(index == 0){
                itemClass = "item active";
            }

            var img = elem.media ? <img src={comp.props.imageUrl + "/" + elem.media} alt="media" /> : <div />;

            if(elem.fullscreen){
                return(
                    <div className={itemClass}>
                        <div className="showreel-media-fullscreen">
                            {img}
                        </div>
                    </div>
                );

            } else {
                return (
                    <div className={itemClass}>
                        <div className="showreel-blurb right">
                            <span>{elem.blurb}</span>
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
        });
        return(
            <div id="showreel-preview" className="carousel slide" data-ride="carousel">
                <ol className="carousel-indicators">
                    {indicators}
                </ol>
                <div className={carouselClass}>
                    <div className='frame-container'>
                        {frameData}
                    </div>
                </div>
                <a className="left carousel-control" href="#showreel-preview" role="button" data-slide="prev" />
                <a className="right carousel-control" href="#showreel-preview" role="button" data-slide="next" />
            </div>);
    },
    componentDidMount: function() {
        this.loadProjectFromServer();
    },
    backToList: function(){
        this.props.valueLink('project', this.state.projectData.id);
    },
    render: function() {
        var backButton = (<span className="back-button" onClick={this.backToList}>back to project</span>);

        var carousel = this.generateFrames();
        return(
            <div>
                {backButton}
                {carousel}
            </div>
        );
    }
});