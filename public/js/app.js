/**
 * ProgressBar class constructor
 *
 * @param {*|jQuery}         selector
 * @param {int|undefined}    [max_value]
 * @param {int|undefined}    [init_value]
 * @param {string|undefined} [text]
 * @constructor
 */
var ProgressBar = function(selector, max_value, init_value, text){
    /**
     * Progressbar selector
     * @type {*|jQuery|null}
     */
    this.selector   = selector;
    /**
     * Maximum value for progressbar
     * @type {int|undefined}
     */
    this.max_value  = max_value;
    /**
     * Initial value for progressbar
     * @type {int|undefined}
     */
    this.init_value = init_value;
    /**
     * Set value for progress bar
     * @param {int} value
     */
    this.value = function(value){
        if(this.selector === null) return false;
        this.selector.val(value);
        return true;
    };
    /**
     * Increment progress bar
     * @param {int} [byWhat]
     */
    this.increment = function(byWhat){
        if(this.selector === null) return false;
        this.selector.val(this.selector.val() + (byWhat === undefined ? 1 : byWhat));
        return true;
    };
    // __construct
    text = (text === undefined) ? "" : "<div>" + text + "</div>";
    if(this.max_value !== undefined){
        this.selector.html(text + "<progress max=\"" + this.max_value + "\" value=\"" + this.init_value + "\" style=\"width: 100%\" />");
        this.selector = this.selector.children().eq((text === "" ? 0 : 1));
    }else{
        this.selector.html(text + "<progress style=\"width: 100%\" />");
        this.selector = null;
    }
};

/*
// May need later
var lock_fasta_method = function(){
    file_method_on = true;
    $('#method').attr('disabled', '');
    var selector = $('#change_method');
    selector.attr('disabled', '');
    selector.removeClass('btn-primary');
    selector.addClass('btn-default');
};
*/

/**
 * InputMethod Object
 *
 * Defines FASTA source
 *
 * @type {{FILE: string, ACCN_GIN: string, current: null|string, setCurrent: InputMethod.setCurrent, getCurrent: InputMethod.getCurrent}}
 */
var InputMethod = {
    // Constants
    FILE     : "file",
    ACCN_GIN : "accn_gin",
    /**
     * Current InputMethod
     * NOTE: don't access it directly, use InputMethod.getCurrent() instead
     * @type {string|null}
     */
    current : null,
    /**
     * set current method
     *
     * @param {String} id
     */
    setCurrent : function(id){
        // Hide all except the requested method
        $('.fasta_method').hide();
        $('#fasta_status').hide();
        $('#' + id).show();
        // set current method
        switch (id){
            case "upload_file":
                this.current = this.FILE;
                break;
            case "input_accn_gin":
                this.current = this.ACCN_GIN;
        }
    },
    /**
     * Get current FASTA file input method
     * @return {string|null}
     */
    getCurrent : function(){
        return this.current;
    }
};

/**
 * InputAnalyzer Object
 *
 * Analyzes user input
 *
 * @type {{GIN: string, ACCN: string, NUCLEOTIDE: string, PROTEIN: string, DB_NUCCORE: string, DB_PROTEIN: string, inputs: Array, selector: null, progress: null, results: Array, file_id: null, init: InputAnalyzer.init, addShortNames: InputAnalyzer.addShortNames, getMetaData: InputAnalyzer.getMetaData, renderer: InputAnalyzer.renderer, upload: InputAnalyzer.upload, buildTable: InputAnalyzer.buildTable, getShortName: InputAnalyzer.getShortName}}
 */
var InputAnalyzer = {
    // ID Constants
    GIN  : "gin",
    ACCN : "accn",
    // SEQ_TYPE constants
    NUCLEOTIDE  : "nucleotide",
    PROTEIN: "protein",
    // DB Constants
    DB_NUCCORE: "nuccore",
    DB_PROTEIN: "protein",
    /**
     * Store input values from the input fields
     * (only for InputMethod.ACCN_GIN)
     * @type {Array}
     * @type {string[]}
     */
    inputs: [],
    /**
     * @type {*|jQuery|null}
     */
    selector: null,
    /**
     * @type {null|ProgressBar}
     */
    progress: null,
    /**
     * @type {Array}
     * @type {{id: int|string, id_type: string, title: string|null, type: string|null, gin: int|null, short_name: string|null}[]}
     */
    results: [],
    /**
     * @type {string|null} file id (only for InputMethod.FILE)
     */
    file_id: null,
    /**
     * Initialize analyzer based on current input method
     *
     * @param [form]
     */
    init: function (form) {
        var parent = this;
        this.selector = $('#fasta_status');
        // show status
        this.selector.html("");
        this.selector.show();

        if(InputMethod.getCurrent() === InputMethod.ACCN_GIN){
            // Get & process the input IDs
            this.inputs = $("#accn_gin").val();
            this.inputs = this.inputs.split(/\s*,\s*/);
            this.results = [];
            //console.log(this.inputs);
            this.progress = new ProgressBar(this.selector, this.inputs.length, 0, "Analyzing...");
            $.each(this.inputs, function (i, id) {
                /**
                 * Which type of ID the user inserted
                 * @type {string}
                 */
                var id_type = /^[\d]+$/.test(id) ? parent.GIN : parent.ACCN;
                parent.getMetaData(id, id_type);
            });
        }else if(InputMethod.getCurrent() === InputMethod.FILE){
            // Upload file
            this.upload(form);
        }
    },
    addShortNames: function(){
        // FIXME: Further filers necessary
        var c_names = this.results.length;
        var status  = true;
        var i;
        for(i = 0; i<c_names; ++i){
            var s_name = $('#sn_' + i).val();
            this.results[i].short_name = s_name;
            if(s_name === null || s_name === "") status = false;
        }
        if(status === false) alert("You must fill all the short names!");
        else{
            var chk = $('#fasta_check_out');
            chk.attr('disabled', '');
            chk.removeClass('btn-primary');
            chk.addClass('btn-default');
            switch(InputMethod.getCurrent()){
                case InputMethod.FILE:
                    chk = $('#upload_new');
                    break;
                case InputMethod.ACCN_GIN:
                    chk = $('#analyze_accn_gin');
            }
            chk.attr('disabled', '');
            chk.removeClass('btn-primary');
            chk.addClass('btn-default');

            for(i = 0; i<c_names; ++i){
                var selector = $('#sn_' + i).parent();
                selector.html(this.results[i].short_name);
            }
        }
    },
// DON'T Call these functions! They are private!
    /**
     * Get meta data using AJAX
     *
     * @param {string} id
     * @param {string} id_type
     */
    getMetaData: function(id, id_type){
        var parent = this;
        /**
         * Response data
         * @type {{id: int|string, id_type: string, title: string|null, type: string|null, gin: int|null, short_name: string|null}}
         */
        var response = {
            id: id,
            id_type: id_type,
            title: null,
            type: null,
            gin: null,
            short_name: null
        };
        /**
         * Process JSON data
         *
         * @param {string} db
         * @param {{result}} data
         */
        function processData(db, data) {
            /**
             * @var {uids}   data.result
             * @var {Array}  data.result.uids
             * @var {int[]}  data.result.uids
             */
            if(data.hasOwnProperty('result') && data.result.hasOwnProperty('uids')){
                /**
                 * GI Numbers
                 * @type {Array}
                 */
                var gin = data.result.uids;
                if(gin.length === 1){
                    response.gin   = gin[0];
                    response.title = data.result[gin].title;
                    response.type  = (db === parent.DB_NUCCORE) ? parent.NUCLEOTIDE : parent.PROTEIN;
                }
            }
        }
        
        function postProcess() {
            parent.results.push(response);
            parent.progress.increment();
            if(parent.inputs.length === parent.results.length){
                //console.log(this.results);
                // There might be three scenario: nucleotide, protein, mixed
                // Nucleotides only or Proteins only are correct, but not the mixed one

                // Set SEQ_TYPE based on retrieved info
                var len  = parent.results.length;
                if(len <= 0) return;
                // Get the common type
                var type = parent.results[0].type;

                for(var i = 0; i<len; ++i){
                    if(parent.results[i].type === null){
                        alert("Some of the Accession/GI numbers you've provided are not found! Please, provide only valid Accession/GI numbers.");
                        parent.selector.hide();
                        return;
                    }
                    if(parent.results[i].type !== type){
                        alert("It looks like you are trying to use nucleotides & proteins at the same time. Please use only nucleotide or only proteins.");
                        parent.selector.hide();
                        return;
                    }
                }
                // UI Changes
                if(type === parent.PROTEIN) {
                    $(".seq_type[value=protein]").prop("checked", true);
                    $(".seq_type").prop("disabled", true);
                }else if(type === parent.NUCLEOTIDE){
                    $(".seq_type[value=nucleotide]").prop("checked", true);
                    $(".seq_type").prop("disabled", true);
                }

                // build table
                parent.buildTable();
            }
        }

        this.renderer(this.DB_NUCCORE, id, function (db, data) {
            processData(parent.DB_NUCCORE, data);
            if(response.gin === null){ // Maybe it's a protein
                parent.renderer(parent.DB_PROTEIN, id, function (db, data) {
                    processData(parent.DB_PROTEIN, data);
                    postProcess();
                });
            }else{
                postProcess();
            }
        });
    },
    /**
     * AJAX handler for getting meta data from ncbi's website
     *
     * @param {string} db
     * @param {string} id
     * @param {function} callBack
     */
    renderer: function(db, id, callBack){
        $.ajax({
            method: 'get',
            url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi',
            data: 'db='+db+'&id='+id+'&retmode=json',
            cache: false,
            dataType: 'json',
            success: function (data) {
                callBack(db, data);
            }
        });
    },
    /**
     * Upload file to server
     * @param form
     */
    upload: function (form) {
        var upload_sel = $('#filef_status');
        upload_sel.show();
        var parent = this;

        $.ajax({
            url: "projects/file_upload",
            type: "POST",
            data: new FormData(form),
            contentType: false,
            cache: false,
            processData: false,
            dataType: 'JSON',
            beforeSend: function(){
                new ProgressBar(upload_sel, undefined, undefined, "Uploading...");
            },
            /**
             * Do this on success
             * @param {{status: int, [data]: Array, [id]: string}} res Data return only if the status is FILE_UPLOAD_SUCCESS
             */
            success: function(res){
                switch(res.status){
                    case 0: // FILE_UPLOAD_SUCCESS
                        $('#upload_file').hide();
                        upload_sel.html('<div class="alert alert-success"><strong>Success!</strong> ' +
                            'The file was uploaded successfully.</div>' +
                            '<div class="btn btn-primary" id="upload_new" onclick="$(\'#filef_status\').hide();' +
                            '$(\'#upload_file\').show();$(\'#method\').removeAttr(\'disabled\');">Upload a new file</div>');
                        /**
                         * @var {{id: int, header: string}[]} res.data
                         */
                        /**
                         * Result as status is FILE_UPLOAD_SUCCESS
                         * @type {{id: int, header: string}[]}
                         */
                        var results    = res.data;
                        parent.file_id = res.id;
                        parent.results = [];
                        for(var i = 0; i < results.length; ++i){
                            var result = {
                                id: results[i].id,
                                id_type: 'file',
                                title: results[i].header,
                                short_name: null,
                                type: InputMethod.FILE,
                                gin: null
                            };
                            parent.results.push(result);
                        }
                        parent.buildTable();
                        break;
                    case 1: // FILE_SIZE_EXCEEDED
                        upload_sel.html('<div class="alert alert-danger"><strong>Upload Failed!</strong> Make sure,<br />' +
                            '<ul>' +
                            '<li>The zip file size is less than 100MB</li>' +
                            '<li>The FASTA file size is less than 20MB</li>' +
                            '</ul>' +
                            '</div>');
                        break;
                    case 2: // FILE_INVALID_MIME
                        upload_sel.html('<div class="alert alert-danger"><strong>Upload Failed!</strong> Make sure the file is a valid zip file.</div>');
                        break;
                    case 3: // FILE_INVALID_FILE
                        upload_sel.html('<div class="alert alert-danger"><strong>Upload Failed!</strong> Make sure,<br />' +
                            '<ul>' +
                            '<li>The zip file is valid</li>' +
                            '<li>The zip file is in right format.</li>' +
                            '<li>The zip file size is less than 100MB</li>' +
                            '<li>The FASTA file size is less than 20MB</li>' +
                            '</ul>' +
                            '</div>');
                        break;
                    default: // FILE_UPLOAD_FAILED
                        upload_sel.html('<div class="alert alert-danger"><strong>Upload Failed!</strong> Please try again. There may be connection problem.</div>');
                }
                $("#filef").val('');
            },
            error: function(){
                upload_sel.html('<div class="alert alert-danger"><strong>Upload Failed!</strong> There may be connection problem.</div>');
            }
        });
    },
    /**
     * Build table to input short names
     */
    buildTable: function () {
        /**
         * Count total species
         * @type {int}
         */
        var c_species = this.results.length;
        /**
         * HTML output
         * @type {string}
         */
        var html = "<p class='text-success'>Found: " + c_species + " Species</p>"
            + "<p>Add short names using the table below: "
            + "(A short name can only contain letters and hyphens)</p>"
            + "<table class='table table-bordered table-striped table-hover'>"
            + "<thead><tr><th>ID</th><th>Title/Header</th><th>Short Name</th></tr></thead>";
        for(var i = 0; i<c_species; ++i){
            html += "<tr>"
                + "<td>" + this.results[i].id + "</td>"
                + "<td>" + this.results[i].title + "</td>"
                + "<td>" + "<input id='sn_" + i + "' class='short_name form-control' value='" + this.getShortName(this.results[i].title) + "'/></td>"
                + "</tr>";
        }
        html += "</table>"
            + "<button class=\"btn btn-primary\" id=\"fasta_check_out\" "
            + "onclick=\"InputAnalyzer.addShortNames()\" style=\"vertical-align: top\">Done</button>";
        this.selector.html(html);
    },
    getShortName: function (title) {
        if(title === null) return null;
        var match;
        // For proteins
        match = title.match(/Short=([\w\s-]+)/);
        if(match !== null) return match[1];

        // TODO A very big function to analyze and generate short name from title/header
        return title;
    }
};

/**
 * Project Object
 * @type {{config:Project.config, result: {Project.result}}}
 */
var Project = {};

/**
 * Project Result
 *
 * @type {{MAW: string, RAW: string, submit_btn: (*|jQuery|HTMLElement), config: {}, prepare: Project.result.prepare, verify: Project.result.verify, send: Project.result.send, restore: Project.result.restore}}
 */
Project.result = {
    MAW: 'maw',
    RAW: 'raw',
    submit_btn: null,
    config: {},
    /**
     * Prepare before publishing result
     *
     * - set project configurations
     * - check if everything's in order
     */
    prepare: function () {
        // Project config
        this.config = {
            project_name: $('#project_name').val(), // #1
            aw_type: $("input[name='aw_type'][value='raw']").is(':checked') ? this.RAW : this.MAW, // #2
            kmer: { // #3
                min: toInt($('#kmer_min').val()),
                max: toInt($('#kmer_max').val())
            },
            inversion: $('#inversion').is(":checked"), // #4
            dissimilarity_index: $('#dissimilarity_index').val(), // #5
            sequence_type: $("input[name='seq_type'][value='protein']").is(':checked') ? InputAnalyzer.PROTEIN : InputAnalyzer.NUCLEOTIDE, // #6
            data: InputAnalyzer.results, // #7
            type: InputMethod.getCurrent() // #8
        };

        // Special for InputMethod.FILE
        if(InputMethod.getCurrent() === InputMethod.FILE){
            this.config.file_id = InputAnalyzer.file_id; // #9
            if(this.config.file_id === null) return false;
        }

        // Check configs
        function isEmpty(field) {
            return field === "" || field === null;
        }
        function toInt(field) {
            return field | 0;
        }

        return ( !isEmpty(this.config.project_name)
            && (0 <= this.config.kmer.min <= this.config.kmer.max)
            && !isEmpty(this.config.dissimilarity_index) );
    },
    /**
     * Verify inputs before sending
     *
     * @returns {boolean}
     */
    verify: function(){
        if(!this.prepare()){
            alert('It seems, you\'ve left out some mandatory fields. Please fill them in.');
            return false;
        }
        return true;
    },
    /**
     * Send request for result
     */
    send: function () {
        if(!this.verify()) return false;
        this.submit_btn = $('#p_btn');

        var parent = this;
        // TODO: Modify this request to make interactive
        $.ajax({
            method: 'post',
            url: 'projects/new',
            data: {config: JSON.stringify(this.config)},
            cache: false,
            dataType: 'json',
            beforeSend: function(){
                var btn = parent.submit_btn;
                btn.removeClass('btn-primary');
                btn.addClass('btn-default disabled');
                btn.attr('onclick', null);
                btn.html("<img width='11' src='css/images/spinner.gif'> Loading...");
            },
            success: function(res){
                if(res !== null && res.id !== null) window.location.assign('projects/' + res.id);
                else parent.restore();
            },
            error: function(xhr, status){
                if(status !== null) parent.restore();
            }
        });
    },
    /**
     * Restore form if an error occurs
     */
    restore: function(){
        alert("An error occurred, try again");
        var btn = this.submit_btn;
        btn.removeClass('btn-default disabled');
        btn.addClass('btn-primary');
        btn.attr('onclick', 'Project.result.send()');
        btn.html("Show Result");
    }
};
