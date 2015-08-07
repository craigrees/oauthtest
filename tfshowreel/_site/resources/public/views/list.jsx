
var ProjectTemplate = {
    id: undefined,
    name: undefined,
    logo: undefined,
    background: 'black',
    frames: []
};

var frameTemplate = {
    media: undefined,
    blurb:null,
    fullscreen: false,
    transition:'left'
};

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

var ProjectList = React.createClass({
    getInitialState: function() {
        return {
            projectList: {projects:[]}
        };
    },
    loadProjectsFromServer: function() {
        var comp = this;
        $.ajax({
            url: this.props.url + "/list",
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
    removeProject: function(index) {
        var comp = this;
        if(confirm("Are you sure?") == true) {
            var projectList = this.state.projectList;
            //console.log(this.props.url + "/" + projectList.projects[index].id);

            $.ajax({
                url: this.props.url + "/" + projectList.projects[index].id,
                type: 'DELETE',
                success: function() {
                    console.log('project deleted');
                    projectList.projects.splice(index, 1);
                    comp.submitProjectList(projectList);
                },
                error: function(xhr, status, err) {
                    console.error('Project was not deleted');
                }
            });
        }
    },
    toggleShowFlag: function(index) {
        var projectList = this.state.projectList;
        projectList.projects[index].show = !projectList.projects[index].show;
        this.submitProjectList(projectList);
    },
    accessProject: function(projectId) {
        this.props.valueLink('project', projectId);
    },
    submitProject: function() {
        var comp = this;
        var projectName = this.refs.projectName.getDOMNode().value;
        var projectId = guid();
        var project = {id: projectId, name: projectName, show: false, url: this.props.url + '/' + projectId};

        //add new project to project list
        this.loadProjectsFromServer();
        var projectList = this.state.projectList;
        projectList.projects.push(project);
        //console.log(data);

        //create the new project from project domain
        var newProject = ProjectTemplate;
        newProject.id = projectId;
        newProject.name = projectName;
        newProject.frames = [];
        newProject.frames.push(frameTemplate);

        comp.refs.projectName.getDOMNode().value = '';

        //store new project in database and add it to project list
        $.ajax({
            url: this.props.url + "/" + projectId,
            dataType: 'json',
            contentType: 'application/json',
            type: 'PUT',
            data: JSON.stringify(newProject),
            processData: false,
            success: function() {
                //console.log(newProject);
                comp.submitProjectList(projectList);
            },
            error: function(xhr, status, err) {
                console.error(comp.props.url, status, err.toString());
            }
        });
    },
    submitProjectList: function(data) {
        var comp = this;
        $.ajax({
            url: comp.props.url + "/list",
            dataType: 'json',
            contentType: 'application/json',
            type: 'PUT',
            data: JSON.stringify(data),
            processData: false,
            success: function() {
                comp.loadProjectsFromServer();
            },
            error: function(xhr, status, err) {
                console.error(comp.props.url, status, err.toString());
            }
        });
    },
    render: function() {
        var comp = this;
        console.log(this.state.projectList);
        var list = this.state.projectList.projects.map(function(elem, index) {
            if(elem) {
                var className = "flag right";
                if(elem.show) {
                    className += " green";
                } else {
                    className += " red";
                }
                var item = (<div className="list-item">
                                <span className="project-name" onClick={comp.accessProject.bind(null, elem.id)}>{elem.name}</span>
                                <span className="red-x right" onClick={comp.removeProject.bind(null,index)}>x</span>
                                <div className={className} onClick={comp.toggleShowFlag.bind(null,index)}><span></span></div>
                            </div>);
                return {item};
            }
        });

        return (
            <div className="project-list">
                <div>{list}</div>
                <br/>
                <input type="text" ref="projectName" />
                <input type="button" value="add project" onClick={this.submitProject} />
            </div>
        );
    }
});