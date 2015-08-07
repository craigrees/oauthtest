
var App = React.createClass({

    getInitialState: function () {
        return {
        page: 'project',
        value: null
      };
    },
    render: function() {
        var comp = this;
        var valueLink = function(page, value) {
            comp.setState({page: page, value: value});
        };
        var Element;

        if(this.state.page == 'project' && !this.state.value){
            Element = ProjectList;
        } else if(this.state.page == 'project' && this.state.value){
            Element = ProjectPage;
        } else if(this.state.page == 'preview' && this.state.value){
            Element = PreviewPage;
        }

        return <Element url="/showreel-posts/showreel" imageUrl="/showreel-image/showreelMedia" valueLink={valueLink} valueData={this.state.value}/>;
    }

});

React.render(<App/>, document.getElementById("content"));
