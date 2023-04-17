// hardcoded in, maybe can find a way to do this through functions
var permission_groups_list = { 
    Read : '<br> &#x2022; list folder/read contents <br> &#x2022; read attributes <br> &#x2022; read extended attributes <br> &#x2022; read permissions', 
    Write : '<br> &#x2022; create files/write data <br> &#x2022; create folders/append data <br> &#x2022;  write attributes <br> &#x2022; write extended attributes',
    Read_Execute : '<br> &#x2022; traverse folder/execute file <br> &#x2022; list folder/read contents <br> &#x2022; read attributes <br> &#x2022; read extended attributes <br> &#x2022; read permissions' ,
    Modify : '<br> &#x2022; create files/write data <br> &#x2022; create folders/append data <br> &#x2022; write attributes <br> &#x2022; write extended attributes <br> &#x2022; delete subfolders and files <br> &#x2022; delete' ,
    Full_control : '<br> &#x2022; traverse folder/execute file <br> &#x2022; list folder/read contents <br> &#x2022; read attributes <br> &#x2022; read extended attributes <br> &#x2022; create files/write data <br> &#x2022; create folders/append data <br> &#x2022; write attributes <br> &#x2022; write extended attributes <br> &#x2022; delete subfolders and files <br> &#x2022; delete <br> &#x2022; read permissions <br> &#x2022; change permissions <br> &#x2022; take ownership' , 
    Special_permissions: '<br> &#x2022; permissions that are not set using one of the above permission groups (choose a user to see specifics)'
}

// ---- Define your dialogs and panels here ----
// sidepanel setup
let panel = define_new_effective_permissions("panel_id", add_info_col = true)
let user_sel = define_new_user_select_field("user_id", "Select User", on_user_change = function(selected_user)
{
    $('#panel_id').attr('username', selected_user)
})

$('#sidepanel').append(user_sel)
$('#sidepanel').append(panel)
//add label to the setting button
$('.permbutton').append('View/Edit Permission')

// dialog box for info icon
let single_perm_dialog = define_new_dialog("perm_dialog_id", title='Permission Info')
$('.perm_info').click(function(){
    $('#perm_dialog_id').dialog('open')

    file_obj = path_to_file[$('#panel_id').attr('filepath')]
    user_obj = all_users[$('#panel_id').attr('username')]
    perm_name = $(this).attr('permission_name')

    let explanation_obj = allow_user_action(file_obj, user_obj, perm_name, explain_why = true)
    let explanation_text = get_explanation_text(explanation_obj)
    $('#perm_dialog_id').text(explanation_text)
})

// dialog box for permission group info icon
let group_dialog = define_new_dialog("group_dialog_id", title='Permission Group Info')
$('.perm_group_info').click(function(){
    $('#group_dialog_id').dialog('open')

    let group_name = $(this).attr('permission_group')
    let group_text = "Permissions included in " + group_name + " are: " + permission_groups_list[group_name]

    $('#group_dialog_id').html(group_text)
})

// ---- Display file structure ----

// (recursively) makes and returns an html element (wrapped in a jquery object) for a given file object
function make_file_element(file_obj) {
    let file_hash = get_full_path(file_obj)

    if(file_obj.is_folder) {
        let folder_elem = $(`<div class='folder' id="${file_hash}_div">
            <h3 class="selection" id="${file_hash}_header">
                <span class="oi oi-folder" id="${file_hash}_icon"/> ${file_obj.filename} 
                <button class="ui-button ui-widget ui-corner-all permbutton cog-button-css" path="${file_hash}" id="${file_hash}_permbutton"> 
                    <span class="oi oi-cog" id="${file_hash}_permicon"/>
                </button>
            </h3>
        </div>`)

        // append children, if any:
        if( file_hash in parent_to_children) {
            let container_elem = $("<div class='folder_contents'></div>")
            folder_elem.append(container_elem)
            for(child_file of parent_to_children[file_hash]) {
                let child_elem = make_file_element(child_file)
                container_elem.append(child_elem)
            }
        }
        return folder_elem
    }
    else {
        return $(`<div class='file selection'  id="${file_hash}_div">
            <span class="oi oi-file" id="${file_hash}_icon"/> ${file_obj.filename}
            <button class="ui-button ui-widget ui-corner-all permbutton cog-button-css" path="${file_hash}" id="${file_hash}_permbutton"> 
                <span class="oi oi-cog" id="${file_hash}_permicon"/>
            </button>
        </div>`)
    }
}

for(let root_file of root_files) {
    let file_elem = make_file_element(root_file)
    $( "#filestructure" ).append( file_elem);    
}

// highlights selected path and sets path variable
let $cols = $('.selection').click(function(e) {
    $cols.removeClass('selected')
    $(this).addClass('selected')

    let path_id = $(this).attr('id');
    let matches = path_id.match(/[_]\w{3,6}$/)
    let path = path_id.replace(matches[0],'')

    $('#panel_id').attr('filepath', path)
});


// make folder hierarchy into an accordion structure
$('.folder').accordion({
    collapsible: true,
    heightStyle: 'content'
}) // TODO: start collapsed and check whether read permission exists before expanding?


// -- Connect File Structure lock buttons to the permission dialog --

// open permissions dialog when a permission button is clicked
$('.permbutton').click( function( e ) {
    // Set the path and open dialog:
    let path = e.currentTarget.getAttribute('path');
    perm_dialog.attr('filepath', path)
    perm_dialog.dialog('open')
    //open_permissions_dialog(path)

    // Deal with the fact that folders try to collapse/expand when you click on their permissions button:
    e.stopPropagation() // don't propagate button click to element underneath it (e.g. folder accordion)
    // Emit a click for logging purposes:
    emitter.dispatchEvent(new CustomEvent('userEvent', { detail: new ClickEntry(ActionEnum.CLICK, (e.clientX + window.pageXOffset), (e.clientY + window.pageYOffset), e.target.id,new Date().getTime()) }))
});


// ---- Assign unique ids to everything that doesn't have an ID ----
$('#html-loc').find('*').uniqueId() 

//creating confirmaton pop up window when user change permissions
function myFunction() {
    var result = confirm("Are you sure you want to do this?");
    if (result == true) {
      // User clicked OK
      console.log("pressed ok")
    } else {
      // User clicked Cancel or closed the dialog
      console.log("pressed cancel")
    }
}

// Define the dialog box - view_baseline line 472 User Dialog
// let user_select_contents = $("#user_select_dialog").dialog({
//     height: 450,
//     width: 400,
//     modal: true,
//     autoOpen: false,
//     appendTo: "#html-loc",
//     position: { my: "top", at: "top", of: $('#html-loc') },
//     buttons: {
//       Cancel: {
//         text: "Cancel",
//         id: "user-select-cancel-button",
//         click: function() {
//           $(this).dialog("close");
//         }
//       },
//       Confirm: {
//         text: "Confirm",
//         id: "user-select-confirm-button",
//         click: function() {
//           let to_populate_id = $(this).attr('to_populate');
//           let selected_value = $(this).attr('username');
//           let confirmation = confirm("Are you sure you want to make this change?");
//           if (confirmation) {
//             $(`#${to_populate_id}`).text(selected_value);
//             $(`#${to_populate_id}`).attr('selected_user', selected_value);
//             $(this).dialog("close");
//           }
//         }
//       }
//     }
//   });
  
//   // Add event listener to button
//   $('#open-dialog-button').on('click', function() {
//     user_select_contents.dialog('open');
//   });
  