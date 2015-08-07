
function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

var ProjectPage = React.createClass({
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
            url: "/showreel-posts/showreel/" + this.props.valueData + ".json",
            dataType: 'json',
            success: function(data) {
                comp.setState({projectData: data});
            },
            error: function(xhr, status, err) {
                console.log('error');
            }
        });
    },
    save: function(updatedProject) {
        var comp = this;
        $.ajax({
            url: "/showreel-posts/showreel" + this.props.valueData + ".json",
            dataType: 'json',
            contentType: 'application/json',
            type: 'PUT',
            data: JSON.stringify(updatedProject),
            processData: false,
            success: function() {
                comp.loadProjectFromServer();
            },
            error: function(xhr, status, err) {
                console.error(comp.props.url, status, err.toString());
            }
        });
    },
    componentDidMount: function() {
        this.loadProjectFromServer();
    },
    backToList: function(){
        this.props.valueLink('project', null);
    },
    render: function() {
        var comp = this;
        var backButton = (<span className="back-button" onClick={this.backToList}>back to list</span>);

        var subValueLink = function(updatedProfile) {
            comp.save(updatedProfile);
        };

        return (
            <div className="slim">
                {backButton}
                <ProjectDets url={this.props.url} imageUrl={this.props.imageUrl} project={this.state.projectData} subValueLink={subValueLink} valueLink={this.props.valueLink}/>
            </div>
        );
    }
});

var ProjectDets = React.createClass({
    getInitialState: function() {
        return {
            project: this.props.project,
            projectName: undefined,
            projectList: undefined,
            listIndex: undefined
        };
    },
    save: function(attribute,frame,objProp,newVal) { //TODO: tidy up
        var elementId = attribute + frame;
        var updatedProject = this.state.project;
        if(frame != null) { //if editing frame data
            if(newVal != null){
                updatedProject.frames[frame][attribute] = newVal;
            } else {
                updatedProject.frames[frame][attribute] = document.getElementById(elementId)[objProp];
            }
        } else { //if editing overall project data
            if(newVal != null){
                updatedProject[attribute] = newVal;
            } else {
                var newName = document.getElementById(attribute)[objProp];
                updatedProject[attribute] = newName;
                this.updateList(newName);
            }
        }
        this.props.subValueLink(updatedProject);
    },
    changeBackground: function(color){
        var updatedProject = this.state.project;
        updatedProject.background = color;
        this.props.subValueLink(updatedProject);

    },
    componentWillReceiveProps: function(nextProps){
        this.getProjectList();
        this.setState({project: nextProps.project});
        this.setState({projectName: nextProps.project.name});
    },
    getProjectList: function() {
        var comp = this;

        $.ajax({
            url: "/showreel-posts/showreel/list.json",
            dataType: 'json',
            success: function(data) {
                comp.setState({projectList: data});
                data.projects.map(function(elem, index){
                    if(elem.id == comp.props.project.id) {
                        comp.setState({listIndex: index});
                    }
                });
            },
            error: function(xhr, status, err) {
                console.log('error');
            }
        });
    },
    updateList: function(newName){
        var list = this.state.projectList;
        list.projects[this.state.listIndex].name = newName;
        this.setState({projectList: list});

        //replace old project list in riak with new project list
        $.ajax({
            url: this.props.url + "/list.json",
            dataType: 'json',
            contentType: 'application/json',
            type: 'PUT',
            data: JSON.stringify(this.state.projectList),
            processData: false,
            success: function() {
                console.log('List updated');
            },
            error: function(xhr, status, err) {
                console.error('Project list failed to be updated');
            }
        });
    },
    inputUpdate: function(attribute, frame) { //keeps the projects state up to date and causes inputs to update to new value
        var currentData = this.state.project;
        var data = document.getElementById(attribute + frame).value;

        //Limits blurb field to 510 characters
        if(data.length > 510){
            return
        }

        currentData.frames[frame][attribute] = data;
        this.setState({project: currentData});
    },
    handleSubmit: function(e) {
        e.preventDefault();
    },
    handleFile: function(index) {
        var comp = this;
        var reader = new FileReader();
        var data = new FormData();
        var file;
        var preview;
        var url;
        var mediaId;
        var newMedia = false;

        var logo = (index == "Logo");

        if(logo){
            preview = document.getElementById("projectLogo");
            file = document.getElementById("fileSelectorLogo").files[0];
            data.append('file', file);

            if (this.state.project.logo) {
                url = this.props.imageUrl + "/" + this.state.project.logo;
            } else {
                mediaId = guid();
                console.log(mediaId);
                url = this.props.imageUrl + "/" + mediaId;
                newMedia = true;
            }
        }else {
            preview = document.getElementById("mediaPreview" + index);
            file = document.getElementById("fileSelector" + index).files[0];
            data.append('file', file);

            if (this.state.project.frames[index].media) {
                url = this.props.imageUrl + "/" + this.state.project.frames[index].media;
            } else {
                mediaId = guid();
                console.log(mediaId);
                url = this.props.imageUrl + "/" + mediaId;
                newMedia = true;
            }
        }

        if (file) {
            reader.readAsDataURL(file);
            $.ajax({
                url: url,
                contentType: false,
                type: 'POST',
                data: data,
                processData: false,
                success: function() {
                    console.log('image uploaded');
                    if(newMedia){
                        if(logo){
                            comp.save("logo", null, null, mediaId);
                        }else{
                            comp.save("media", index, null, mediaId);
                        }
                    }
                },
                error: function(xhr, status, err) {
                    console.error('Image was not uploaded');
                }
            });

            reader.onloadend = function() {
                preview.src = reader.result;
            };
        }
    },
    addFrame: function() {
        var updatedProject = this.state.project;
        updatedProject.frames.push(frameTemplate);
        this.props.subValueLink(updatedProject);
        this.setState({project: updatedProject});
    },
    removeFrame: function(index) {
        var updatedProject = this.state.project;

        if (updatedProject.frames.length > 1){
            updatedProject.frames.splice(index, 1);
        } else {
            updatedProject.frames[0] = frameTemplate;
        }
        this.props.subValueLink(updatedProject);
        this.setState({project: updatedProject});
    },
    previewProject: function() {
        this.props.valueLink('preview', this.props.project.id);
    },
    removeImage: function(frame){
        var comp = this;
        var mediaId;
        var updatedProject = this.state.project;

        if (frame != null){
            mediaId = this.state.project.frames[frame].media;
        }else{
            mediaId = this.state.project.logo;
        }

        $.ajax({
            url: this.props.url + "Media/" + mediaId,
            type: 'DELETE',
            success: function() {
                console.log('image deleted');
                if(frame != null) {
                    updatedProject.frames[frame].media = null;
                } else {
                    updatedProject.logo = null;
                }
                comp.props.subValueLink(updatedProject);
                comp.setState({project: updatedProject});
            },
            error: function(xhr, status, err) {
                console.error('Image was not deleted');
            }
        });

    },
    render: function() {
        //console.log(this.props.project);
        var comp = this;
        var projectName = this.state.projectName;
        var logo;

        if(this.state.project.logo != null){
            logo = this.props.imageUrl + "/" + this.state.project.logo;
        } else {
            logo = "./images/no-image.jpg";
        }


        var bgBlackClass = (this.state.project.background == 'black') ? 'color-block black selected' : 'color-block black';
        var bgDkGreyClass = (this.state.project.background == 'dark-grey') ? 'color-block dark-grey selected' : 'color-block dark-grey';
        var bgGreyClass = (this.state.project.background == 'light-grey') ? 'color-block light-grey selected' : 'color-block light-grey';
        var bgWhiteClass = (this.state.project.background == 'white') ? 'color-block white selected' : 'color-block white';

        var addFrame = <div />;
        if(this.state.project.frames.length < 10){
            addFrame = <div className="addFrame" onClick={this.addFrame}><span>Add Frame</span></div>;
        }
        var frames = this.state.project.frames.map(function(elem, index) {
            if(elem) {
                var fullscreen = (<input type="checkbox" id={"fullscreen"+index}  onChange={comp.save.bind(null, 'fullscreen', index, 'checked', null)} />);
                var blurb = (<textarea value={elem.blurb} id={"blurb"+index} onChange={comp.inputUpdate.bind(null,'blurb', index)} onBlur={comp.save.bind(null, 'blurb', index, 'value', null)} maxLength="530"/>);
                //check if frame is supposed to have fullscreen checkbox checked
                if(elem.fullscreen){
                    fullscreen = (<input type="checkbox" id={"fullscreen"+index}  onChange={comp.save.bind(null, 'fullscreen', index, 'checked', null)} checked/>);
                    blurb = (<textarea className="light-grey" value={elem.blurb} id={"blurb"+index} disabled/>);
                }

                var image;
                if(elem.media != null){
                    image = comp.props.imageUrl + "/" + elem.media
                } else {
                    image = "./images/no-image.jpg";
                }
                var item = (
                    <div className="frame-edit">
                        <span className="red-x right" onClick={comp.removeFrame.bind(null,index)}>x</span>
                        <h4>Frame {index + 1}</h4>
                        <label>Image/Video</label><img src={image} className="media-preview" id={"mediaPreview"+index} alt="Image preview..."/>
                        <br/>
                        <span className="remove-image media-selector" onClick={comp.removeImage.bind(null,index)}>remove</span>
                        <br/>
                        <input type="file" className="media-selector" id={"fileSelector"+index} name="media" onChange={comp.handleFile.bind(null,index)}/>
                        <br/>
                        <label>Blurb</label>{blurb}
                        <br/>
                        <label>Effect</label>{fullscreen} Fullscreen media
                        <br/>
                        <select className="effect-select" id={"transition"+index} value={elem.transition} onChange={comp.save.bind(null, 'transition', index, 'value', null)}>
                            <option value="left">Left Transition</option>
                            <option value="right">Right Transition</option>
                        </select>
                    </div>
                );
                return {item};
            }
        });

        return(
            <div className="project-edit">
                <img className="logo" id="projectLogo" src={logo} alt="Logo" />
                <div className="preview" onClick={this.previewProject}>Preview</div>
                <br/>
                <span className="remove-image" onClick={this.removeImage.bind(null, null)}>remove</span>
                <br/>
                <input type="file" className="logo-Upload-button" id={"fileSelectorLogo"} name="logo" onChange={comp.handleFile.bind(null,"Logo")}/>
                <br/>
                <label>Project Name</label><input type="text" id="name" value={projectName} onChange={this.save.bind(null, 'name', null, 'value', null)}/>
                <label style={{"marginLeft":"20px"}}>Background</label>
                <div className={bgBlackClass} onClick={this.changeBackground.bind(null, 'black')}></div>
                <div className={bgDkGreyClass} onClick={this.changeBackground.bind(null, 'dark-grey')}></div>
                <div className={bgGreyClass} onClick={this.changeBackground.bind(null, 'light-grey')}></div>
                <div className={bgWhiteClass} onClick={this.changeBackground.bind(null, 'white')}></div>
                <br/>
                {frames}
                {addFrame}
            </div>
        );
    }
});